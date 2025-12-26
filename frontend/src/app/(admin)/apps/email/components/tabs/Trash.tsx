import { useEffect, useState } from 'react'
import { TabPane } from 'react-bootstrap'

import EmailsList from '../EmailsList'
import type { EmailType } from '@/types/data'
import { getAllEmails } from '@/helpers/data'

const Trash = () => {
  const [emails, setEmails] = useState<EmailType[]>()

  useEffect(() => {
    const fetchData = async () => {
      const data = await getAllEmails('deleted')
      if (data) setEmails(data)
    }
    fetchData()
  }, [])

  return (
    <TabPane eventKey="Trash" className="fade" role="tabpanel">
      {!!emails?.length ? (
        <>
          <hr />
          <div className="text-center mt-2">
            <p className="mb-0">
              Письма, которые находятся здесь более 30 дней, будут автоматически удалены.{' '}
              <button className="btn p-0 btn-link text-primary ms-2">Очистить корзину сейчас</button>
            </p>
          </div>
          <hr className="mb-3" />
          <EmailsList emails={emails} />
        </>
      ) : (
        <>
          <hr />
          <div className="text-center mt-2">
            <p className="mb-0">У вас нет удалённых писем.</p>
            <p className="mb-0">Удалите письма, чтобы увидеть их здесь</p>
          </div>
          <hr className="mb-0" />
        </>
      )}
    </TabPane>
  )
}

export default Trash
