import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import assert from 'node:assert';
import { after, before, beforeEach, describe, test } from 'node:test';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

const projectId = 'demo-bot-ciseb-rules';
let testEnvironment: RulesTestEnvironment;

const institutionalUser = {
  uid: 'formador-escola',
  email: 'formador@escola.seduc.pa.gov.br',
};

function authenticatedContext(
  uid: string,
  email: string,
  emailVerified = true,
  signInProvider: 'google.com' | 'password' = 'google.com',
) {
  return testEnvironment.authenticatedContext(uid, {
    email,
    email_verified: emailVerified,
    firebase: { sign_in_provider: signInProvider },
  });
}

before(async () => {
  testEnvironment = await initializeTestEnvironment({
    projectId,
    firestore: {
      rules: readFileSync(resolve(process.cwd(), 'firestore.rules'), 'utf8'),
    },
  });
});

beforeEach(async () => {
  await testEnvironment.clearFirestore();
});

after(async () => {
  await testEnvironment.cleanup();
});

describe('Regras de segurança do Firestore', () => {
  test('permite ao usuário Google verificado acessar o próprio perfil nos domínios institucionais', async () => {
    for (const [uid, email] of [
      [institutionalUser.uid, institutionalUser.email],
      ['formador-seduc', 'formador@seduc.pa.gov.br'],
    ]) {
      await testEnvironment.withSecurityRulesDisabled(async context => {
        await setDoc(doc(context.firestore(), 'users', uid), { uid, email });
      });

      const database = authenticatedContext(uid, email).firestore();
      await assertSucceeds(getDoc(doc(database, 'users', uid)));
    }
  });

  test('nega perfil de outro UID, sessão não verificada e provedor diferente de Google', async () => {
    await testEnvironment.withSecurityRulesDisabled(async context => {
      await setDoc(doc(context.firestore(), 'users', 'outra-conta'), {
        uid: 'outra-conta',
        email: 'outra@escola.seduc.pa.gov.br',
      });
    });

    const ownerDatabase = authenticatedContext(
      institutionalUser.uid,
      institutionalUser.email,
    ).firestore();
    const unverifiedDatabase = authenticatedContext(
      institutionalUser.uid,
      institutionalUser.email,
      false,
    ).firestore();
    const passwordDatabase = authenticatedContext(
      institutionalUser.uid,
      institutionalUser.email,
      true,
      'password',
    ).firestore();

    await assertFails(getDoc(doc(ownerDatabase, 'users', 'outra-conta')));
    await assertFails(getDoc(doc(unverifiedDatabase, 'users', institutionalUser.uid)));
    await assertFails(getDoc(doc(passwordDatabase, 'users', institutionalUser.uid)));
  });

  test('nega domínios parecidos, contas sem sessão e acesso aos contadores', async () => {
    const lookalikeDatabase = authenticatedContext(
      'lookalike',
      'pessoa@escola.seduc.pa.gov.br.example.com',
    ).firestore();
    const unauthenticatedDatabase = testEnvironment.unauthenticatedContext().firestore();
    const authenticatedDatabase = authenticatedContext(
      institutionalUser.uid,
      institutionalUser.email,
    ).firestore();

    await assertFails(getDoc(doc(lookalikeDatabase, 'users', 'lookalike')));
    await assertFails(getDoc(doc(unauthenticatedDatabase, 'users', institutionalUser.uid)));
    await assertFails(getDoc(doc(authenticatedDatabase, 'rateLimitCounters', 'counter')));
  });

  test('permite criar o perfil com campos e timestamps esperados', async () => {
    const database = authenticatedContext(
      institutionalUser.uid,
      institutionalUser.email,
    ).firestore();

    await assertSucceeds(setDoc(doc(database, 'users', institutionalUser.uid), {
      uid: institutionalUser.uid,
      email: institutionalUser.email,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }));
  });

  test('permite atualizar perfil sem alterar UID, e-mail ou data de criação', async () => {
    const database = authenticatedContext(
      institutionalUser.uid,
      institutionalUser.email,
    ).firestore();
    const profileRef = doc(database, 'users', institutionalUser.uid);

    await assertSucceeds(setDoc(profileRef, {
      uid: institutionalUser.uid,
      email: institutionalUser.email,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }));

    const existingProfile = await getDoc(profileRef);
    const createdAt = existingProfile.data()?.createdAt;
    assert.ok(createdAt);

    await assertSucceeds(setDoc(profileRef, {
      uid: institutionalUser.uid,
      email: institutionalUser.email,
      createdAt,
      updatedAt: serverTimestamp(),
    }));

    await assertFails(setDoc(profileRef, {
      uid: institutionalUser.uid,
      email: 'outra@escola.seduc.pa.gov.br',
      createdAt,
      updatedAt: serverTimestamp(),
    }));
  });
});
