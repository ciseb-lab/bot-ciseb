import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { INSTITUTIONAL_EMAIL_DOMAINS, isInstitutionalEmail } from '../shared/authPolicy.ts';

describe('Política de domínio institucional', () => {
  test('aceita o domínio completo sem diferenciar maiúsculas e minúsculas', () => {
    assert.deepEqual(INSTITUTIONAL_EMAIL_DOMAINS, ['escola.seduc.pa.gov.br', 'seduc.pa.gov.br']);
    assert.equal(isInstitutionalEmail('Pessoa@Escola.Seduc.Pa.Gov.Br'), true);
    assert.equal(isInstitutionalEmail('Pessoa@Seduc.Pa.Gov.Br'), true);
    assert.equal(isInstitutionalEmail(' pessoa@escola.seduc.pa.gov.br '), true);
  });

  test('rejeita domínios parecidos, subdomínios e endereços malformados', () => {
    for (const email of [
      'pessoa@escola.seduc.pa.gov.br.example.com',
      'pessoa@sub.escola.seduc.pa.gov.br',
      'pessoa@sub.seduc.pa.gov.br',
      'pessoa@escola-seduc-pa-gov-br',
      'pessoa@@escola.seduc.pa.gov.br',
      '@escola.seduc.pa.gov.br',
    ]) {
      assert.equal(isInstitutionalEmail(email), false, email);
    }
  });

  test('normaliza espaços externos antes de comparar o endereço', () => {
    assert.equal(isInstitutionalEmail(' pessoa@escola.seduc.pa.gov.br '), true);
    assert.equal(isInstitutionalEmail(' pessoa@seduc.pa.gov.br '), true);
  });
});
