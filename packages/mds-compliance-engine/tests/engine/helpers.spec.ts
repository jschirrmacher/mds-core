import { Settings } from 'luxon'
import { isRuleActive } from '../../engine/helpers'

describe('Tests isRuleActive checking', () => {
  const oldTimezone = process.env.TIMEZONE
  beforeAll(() => {
    process.env.TIMEZONE = 'UTC'
  })

  afterAll(() => {
    process.env.TIMEZONE = oldTimezone // make sure to reset TIMEZONE to whatever it was before
    Settings.now = () => new Date().valueOf() // make sure to reset luxon
  })

  describe('Null everything', () => {
    it('Tests for rule with no start_time, end_time, or days to be true', () => {
      expect(
        isRuleActive({
          days: null,
          start_time: null,
          end_time: null
        })
      ).toStrictEqual(true)
    })
  })

  describe('Test only days', () => {
    it('Tests for rule with only days and no start_time/end_time to be true if day aligns', () => {
      Settings.now = () => new Date('2021-09-15T05:00:00.000Z').valueOf() // this is a wednesday

      expect(
        isRuleActive({
          days: ['wed'],
          start_time: null,
          end_time: null
        })
      ).toStrictEqual(true)
    })

    it('Tests for rule with only days and no start_time/end_time to be false if day does not align', () => {
      Settings.now = () => new Date('2021-09-15T05:00:00.000Z').valueOf() // this is a wednesday

      expect(
        isRuleActive({
          days: ['mon'],
          start_time: null,
          end_time: null
        })
      ).toStrictEqual(false)
    })
  })

  describe('Tests only start_time && end_time', () => {
    it('Tests start_time/end_time to be true if current time aligns', () => {
      Settings.now = () => new Date('2021-09-15T05:00:00.000Z').valueOf()

      expect(
        isRuleActive({
          days: null,
          start_time: '02:00:00',
          end_time: '10:00:00'
        })
      ).toStrictEqual(true)
    })

    it('Tests start_time/end_time to be false if current time does not align', () => {
      Settings.now = () => new Date('2021-09-15T05:00:00.000Z').valueOf()

      expect(
        isRuleActive({
          days: null,
          start_time: '09:00:00',
          end_time: '10:00:00'
        })
      ).toStrictEqual(false)
    })

    describe('Tests edge case: start_time > end_time (across midnight). e.g. 7pm-5am', () => {
      it('Tests before midnight (true)', () => {
        Settings.now = () => new Date('2021-09-15T21:00:00.000Z').valueOf()

        expect(
          isRuleActive({
            days: null,
            start_time: '19:00:00',
            end_time: '05:00:00'
          })
        ).toStrictEqual(true)
      })

      it('Tests after midnight (true)', () => {
        Settings.now = () => new Date('2021-09-15T04:00:00.000Z').valueOf()

        expect(
          isRuleActive({
            days: null,
            start_time: '19:00:00',
            end_time: '05:00:00'
          })
        ).toStrictEqual(true)
      })

      it('Tests before midnight (false)', () => {
        Settings.now = () => new Date('2021-09-15T15:00:00.000Z').valueOf()

        expect(
          isRuleActive({
            days: null,
            start_time: '19:00:00',
            end_time: '05:00:00'
          })
        ).toStrictEqual(false)
      })

      it('Tests after midnight (false)', () => {
        Settings.now = () => new Date('2021-09-15T04:00:00.000Z').valueOf()

        expect(
          isRuleActive({
            days: null,
            start_time: '19:00:00',
            end_time: '02:00:00'
          })
        ).toStrictEqual(false)
      })
    })
  })

  describe('Tests only start_time', () => {
    it('Truthy test', () => {
      Settings.now = () => new Date('2021-09-15T05:00:00.000Z').valueOf()

      expect(
        isRuleActive({
          days: null,
          start_time: '02:00:00',
          end_time: null
        })
      ).toStrictEqual(true)
    })

    it('Falsy test', () => {
      Settings.now = () => new Date('2021-09-15T05:00:00.000Z').valueOf()

      expect(
        isRuleActive({
          days: null,
          start_time: '06:00:00',
          end_time: null
        })
      ).toStrictEqual(false)
    })
  })

  describe('Tests only end_time', () => {
    it('Truthy test', () => {
      Settings.now = () => new Date('2021-09-15T05:00:00.000Z').valueOf()

      expect(
        isRuleActive({
          days: null,
          start_time: null,
          end_time: '10:00:00'
        })
      ).toStrictEqual(true)
    })

    it('Falsy test', () => {
      Settings.now = () => new Date('2021-09-15T05:00:00.000Z').valueOf()

      expect(
        isRuleActive({
          days: null,
          start_time: null,
          end_time: '04:00:00'
        })
      ).toStrictEqual(false)
    })
  })

  describe('Tests days, start_time, and end_time simultaneously', () => {
    it('Truthy test', () => {
      Settings.now = () => new Date('2021-09-15T05:00:00.000Z').valueOf()

      expect(
        isRuleActive({
          days: ['wed'],
          start_time: '02:00:00',
          end_time: '10:00:00'
        })
      ).toStrictEqual(true)
    })

    it('Falsey test (day misalignment)', () => {
      Settings.now = () => new Date('2021-09-15T05:00:00.000Z').valueOf()

      expect(
        isRuleActive({
          days: ['mon'],
          start_time: '09:00:00',
          end_time: '10:00:00'
        })
      ).toStrictEqual(false)
    })

    it('Falsey test (time misalignment)', () => {
      Settings.now = () => new Date('2021-09-15T05:00:00.000Z').valueOf()

      expect(
        isRuleActive({
          days: ['wed'],
          start_time: '07:00:00',
          end_time: '08:00:00'
        })
      ).toStrictEqual(false)
    })

    describe('Tests edge case: start_time > end_time (across midnight). e.g. 7pm-5am, with days', () => {
      it('Tests before midnight (true)', () => {
        Settings.now = () => new Date('2021-09-15T21:00:00.000Z').valueOf()

        expect(
          isRuleActive({
            days: ['wed'],
            start_time: '19:00:00',
            end_time: '05:00:00'
          })
        ).toStrictEqual(true)
      })

      it('Tests before midnight (false, day misalignment)', () => {
        Settings.now = () => new Date('2021-09-15T21:00:00.000Z').valueOf()

        expect(
          isRuleActive({
            days: ['thu'],
            start_time: '19:00:00',
            end_time: '05:00:00'
          })
        ).toStrictEqual(false)
      })

      it('Tests before midnight (false, time misalignment)', () => {
        Settings.now = () => new Date('2021-09-15T15:00:00.000Z').valueOf()

        expect(
          isRuleActive({
            days: ['wed'],
            start_time: '19:00:00',
            end_time: '05:00:00'
          })
        ).toStrictEqual(false)
      })
    })
  })
})
