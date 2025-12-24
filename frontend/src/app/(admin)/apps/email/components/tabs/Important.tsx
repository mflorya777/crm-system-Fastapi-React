import { useEffect, useState } from 'react'
import { TabPane } from 'react-bootstrap'

import EmailsList from '../EmailsList'
import type { EmailType } from '@/types/data'
import { getAllEmails } from '@/helpers/data'

const Important = () => {
  const [emails, setEmails] = useState<EmailType[]>()

  useEffect(() => {
    const fetchData = async () => {
      const data = await getAllEmails('important')
      if (data) setEmails(data)
    }
    fetchData()
  }, [])

  return (
    <TabPane eventKey="Important" className="fade" role="tabpanel">
      {!!emails?.length ? (
        <EmailsList emails={emails} />
      ) : (
        <>
          <hr />
          <div className="text-center mt-2">
            <p className="mb-0">У вас нет важных писем.</p>
            <p className="mb-0">Пометите письма как важные, чтобы увидеть их здесь</p>
          </div>
          <hr className="mb-0" />
        </>
      )}
    </TabPane>
  )
}

export default Important
