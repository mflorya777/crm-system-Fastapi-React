import { useEffect, useState } from 'react'
import { Button, Card, CardBody, CardHeader, CardTitle } from 'react-bootstrap'

import { currency } from '@/context/constants'
import { getAllTransactions } from '@/helpers/data'
import type { TransactionType } from '@/types/data'

const Transactions = () => {
  const [transactionsData, setTransactionsData] = useState<TransactionType[]>()

  useEffect(() => {
    const fetchData = async () => {
      const data = await getAllTransactions()
      setTransactionsData(data)
    }
    fetchData()
  }, [])

  return (
    <Card>
      <CardHeader className="d-flex justify-content-between align-items-center">
        <CardTitle>Последние транзакции</CardTitle>
        <Button variant="light" size="sm">
          Показать все
        </Button>
      </CardHeader>
      <CardBody>
        <div className="table-responsive">
          <table className="table table-hover mb-0 table-centered">
            <thead>
              <tr>
                <th className="py-1">ID</th>
                <th className="py-1">Дата</th>
                <th className="py-1">Сумма</th>
                <th className="py-1">Статус</th>
                <th className="py-1">Описание</th>
              </tr>
            </thead>
            <tbody>
              {transactionsData?.slice(0, 5).map((transaction, idx) => (
                <tr key={idx}>
                  <td>#{transaction.id}</td>
                  <td>{new Date(transaction.date).toDateString()}</td>
                  <td>
                    {currency}
                    {transaction.amount}
                  </td>
                  <td>
                    <span className={`badge bg-${transaction.status === 'Dr.' ? 'danger' : 'success'}`}>{transaction.status}</span>
                  </td>
                  <td>{transaction.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardBody>
    </Card>
  )
}

export default Transactions
