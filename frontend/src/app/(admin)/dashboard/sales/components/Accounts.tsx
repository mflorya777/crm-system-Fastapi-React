import { accountData } from '../data'
import { Button, Card, CardBody, CardHeader, CardTitle } from 'react-bootstrap'

const Accounts = () => {
  return (
    <Card>
      <CardHeader className="d-flex justify-content-between align-items-center">
        <CardTitle>Новые аккаунты</CardTitle>
        <Button variant="light" size="sm">
          Показать все
        </Button>
      </CardHeader>
      <CardBody className="pb-1">
        <div className="table-responsive">
          <table className="table table-hover mb-0 table-centered">
            <thead>
              <tr>
                <th className="py-1">ID</th>
                <th className="py-1">Дата</th>
                <th className="py-1">Пользователь</th>
                <th className="py-1">Аккаунт</th>
                <th className="py-1">Имя пользователя</th>
              </tr>
            </thead>
            <tbody>
              {accountData.map((account, idx) => {
                return (
                  <tr key={idx}>
                    <td>{account.id}</td>
                    <td>{account.date}</td>
                    <td>
                      <img src={account.user.avatar} alt="avatar-2" className="img-fluid avatar-xs rounded-circle" />
                      <span className="align-middle ms-1">{account.user.name}</span>
                    </td>
                    <td>
                      <span
                        className={`badge badge-soft-${account.status === 'Заблокирован' ? 'danger' : account.status === 'В ожидании' ? 'warning' : 'success'}`}>
                        {account.status}
                      </span>
                    </td>
                    <td>{account.username}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </CardBody>
    </Card>
  )
}

export default Accounts
