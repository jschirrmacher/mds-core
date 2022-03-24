import cache from '@mds-core/mds-agency-cache'
import { getCacheInfo } from '../sandbox-admin-request-handlers'
import type { AgencyApiRequest, AgencyApiResponse } from '../types'

describe('Sandbox admin request handlers', () => {
  describe('Gets cache info', () => {
    it('Gets cache info', async () => {
      const res: AgencyApiResponse = {} as AgencyApiResponse
      res.status = jest.fn().mockImplementationOnce(() => ({ send: jest.fn().mockImplementation(() => 'okay') }))
      jest.spyOn(cache, 'info').mockImplementationOnce(async () => await Promise.resolve({ okay: 'there' }))

      await getCacheInfo({} as AgencyApiRequest, res)
      expect(res.status).toBeCalledWith(200)
    })
    it('Fails to get cache info', async () => {
      const res: AgencyApiResponse = {} as AgencyApiResponse
      res.status = jest.fn().mockImplementationOnce(() => ({ send: jest.fn().mockImplementation(() => 'okay') }))
      jest.spyOn(cache, 'info').mockImplementationOnce(async () => await Promise.reject({ okay: 'there' }))

      await getCacheInfo({} as AgencyApiRequest, res)
      expect(res.status).toBeCalledWith(500)
    })
  })
})
