import { describe, expect, it } from 'vitest'
import { addDays, maskMoney, parseAmount, todayStr } from './format'

describe('dinheiro digitado', () => {
  it('aceita vírgula, ponto e milhar', () => {
    expect(parseAmount('50')).toBe(50)
    expect(parseAmount('50,5')).toBe(50.5)
    expect(parseAmount('50.5')).toBe(50.5)
    expect(parseAmount('1.234,56')).toBe(1234.56)
    expect(parseAmount('1.234')).toBe(1234) // grupos de 3 sem vírgula = milhar
    expect(parseAmount('1.234.567')).toBe(1234567)
    expect(parseAmount('1.5')).toBe(1.5) // fora do padrão de milhar, o ponto é decimal
    expect(parseAmount('12.5')).toBe(12.5)
    expect(parseAmount('abc')).toBe(0)
    expect(parseAmount('-50')).toBe(0) // negativo nunca vira meta
  })
  it('maskMoney normaliza p/ X,XX e faz round-trip com parseAmount', () => {
    expect(maskMoney('50')).toBe('50,00')
    expect(maskMoney('1234.5')).toBe('1234,50')
    expect(maskMoney('1.234,56')).toBe('1234,56')
    expect(maskMoney('1.234')).toBe('1234,00')
    expect(maskMoney('')).toBe('')
    expect(maskMoney('x')).toBe('x')
    expect(maskMoney('-50')).toBe('-50') // fica visível p/ a pessoa corrigir
    for (const v of [420, 1000, 1234.5, 0.5]) expect(parseAmount(maskMoney(String(v)))).toBe(v)
  })
})

describe('datas no fuso local', () => {
  it('todayStr bate com a data local, não com o UTC', () => {
    const d = new Date()
    const local = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    expect(todayStr()).toBe(local)
  })
  it('addDays atravessa mês e ano sem deslize de fuso', () => {
    expect(addDays('2026-08-31', 1)).toBe('2026-09-01')
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
  })
})
