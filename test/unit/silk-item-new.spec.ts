import { describe, expect, it } from 'vitest'
import { z } from 'zod'

const silkItemSchema = z.object({
  title: z.string().min(1, 'กรุณากรอกชื่อผืนผ้า'),
  pattern: z.string().optional(),
  material: z.string().optional(),
  technique: z.string().optional(),
  widthCm: z.coerce.number().positive('ความกว้างต้องมากกว่า 0').optional().or(z.literal('')),
  lengthCm: z.coerce.number().positive('ความยาวต้องมากกว่า 0').optional().or(z.literal('')),
  productionDate: z.string().optional(),
  notes: z.string().optional(),
})

describe('SilkItem Schema Validation', () => {
  it('validates required title field', () => {
    const result = silkItemSchema.safeParse({
      title: '',
      pattern: 'มัดมี',
      material: 'ไหม',
      technique: 'ทอผ้าข้าง',
      widthCm: 80,
      lengthCm: 200,
      productionDate: '2024-01-15',
      notes: 'ทดสอบ',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path[0]).toBe('title')
      expect(result.error.issues[0].message).toBe('กรุณากรอกชื่อผืนผ้า')
    }
  })

  it('accepts valid title', () => {
    const result = silkItemSchema.safeParse({
      title: 'ผ้าไหมมัดมีกล้วยหอม',
      pattern: 'มัดมี',
      material: 'ไหม',
      technique: 'ทอผ้าข้าง',
      widthCm: 80,
      lengthCm: 200,
      productionDate: '2024-01-15',
      notes: 'ทดสอบ',
    })

    expect(result.success).toBe(true)
  })

  it('validates widthCm must be positive', () => {
    const result = silkItemSchema.safeParse({
      title: 'ผ้าไหมทดสอบ',
      widthCm: -10,
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path[0]).toBe('widthCm')
      expect(result.error.issues[0].message).toBe('ความกว้างต้องมากกว่า 0')
    }
  })

  it('validates lengthCm must be positive', () => {
    const result = silkItemSchema.safeParse({
      title: 'ผ้าไหมทดสอบ',
      lengthCm: -5,
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path[0]).toBe('lengthCm')
      expect(result.error.issues[0].message).toBe('ความยาวต้องมากกว่า 0')
    }
  })

  it('accepts empty string for optional numeric fields', () => {
    const result = silkItemSchema.safeParse({
      title: 'ผ้าไหมทดสอบ',
      widthCm: '',
      lengthCm: '',
    })

    expect(result.success).toBe(true)
  })

  it('accepts valid positive numbers', () => {
    const result = silkItemSchema.safeParse({
      title: 'ผ้าไหมทดสอบ',
      widthCm: 80.5,
      lengthCm: 200,
    })

    expect(result.success).toBe(true)
  })

  it('accepts optional fields as undefined', () => {
    const result = silkItemSchema.safeParse({
      title: 'ผ้าไหมทดสอบ',
    })

    expect(result.success).toBe(true)
  })

  it('coerces string numbers to numbers', () => {
    const result = silkItemSchema.safeParse({
      title: 'ผ้าไหมทดสอบ',
      widthCm: '80',
      lengthCm: '200',
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(typeof result.data.widthCm).toBe('number')
      expect(typeof result.data.lengthCm).toBe('number')
      expect(result.data.widthCm).toBe(80)
      expect(result.data.lengthCm).toBe(200)
    }
  })
})