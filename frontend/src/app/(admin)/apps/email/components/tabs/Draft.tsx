import { useEffect, useState } from 'react'
import { TabPane } from 'react-bootstrap'

import { getAllEmails } from '@/helpers/data'
import type { EmailType } from '@/types/data'
import EmailsList from '../EmailsList'

const Draft = () => {
  const [emails, setEmails] = useState<EmailType[]>()

  useEffect(() => {
    const fetchData = async () => {
      const data = await getAllEmails('draft')
      if (data) setEmails(data)
    }
    fetchData()
  }, [])

  return (
    <TabPane eventKey="Draft" className="fade" role="tabpanel">
      {!!emails?.length ? (
        <EmailsList emails={emails} />
      ) : (
        <>
          <hr />
          <div className="text-center mt-2">
            <p className="mb-0">У вас нет сохранённых черновиков.</p>
            <p className="mb-0">Сохранение черновика позволяет сохранить сообщение, которое вы ещё не готовы отправить.</p>
          </div>
          <hr className="mb-0" />
        </>
      )}
    </TabPane>
  )
}

export default Draft
