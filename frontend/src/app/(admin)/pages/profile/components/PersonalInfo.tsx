import { Card, CardBody, CardHeader, CardTitle } from 'react-bootstrap'

const PersonalInfo = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle as={'h5'}>Личная информация</CardTitle>
      </CardHeader>
      <CardBody>
        <ul className="list-group">
          <li className="list-group-item border-0 border-bottom px-0 pt-0">
            <div className="d-flex flex-wrap align-items-center">
              <h5 className="me-2 fw-medium mb-0">Имя :</h5>
              <span className="fs-14 text-muted">Jeannette C. Mullin</span>
            </div>
          </li>
          <li className="list-group-item border-0 border-bottom px-0">
            <div className="d-flex flex-wrap align-items-center">
              <h5 className="me-2 fw-medium mb-0">Email :</h5>
              <span className="fs-14 text-muted">jeannette@rhyta.com</span>
            </div>
          </li>
          <li className="list-group-item border-0 border-bottom px-0">
            <div className="d-flex flex-wrap align-items-center">
              <h5 className="me-2 mb-0 fw-medium">Телефон :</h5>
              <span className="fs-14 text-muted">+909 707-302-2110</span>
            </div>
          </li>
          <li className="list-group-item border-0 border-bottom px-0">
            <div className="d-flex flex-wrap align-items-center">
              <h5 className="me-2 mb-0 fw-medium">Должность :</h5>
              <span className="fs-14 text-muted">Full Stack разработчик</span>
            </div>
          </li>
          <li className="list-group-item border-0 border-bottom px-0">
            <div className="d-flex flex-wrap align-items-center">
              <h5 className="me-2 mb-0 fw-medium">Возраст :</h5>
              <span className="fs-14 text-muted">31 год</span>
            </div>
          </li>
          <li className="list-group-item border-0 border-bottom px-0">
            <div className="d-flex flex-wrap align-items-center">
              <h5 className="me-2 mb-0 fw-medium">Ссылки :</h5>
              <span className="fs-14">
                <a href="#!" className="text-primary">
                  https://myworkbench-portfolio.com
                </a>
              </span>
            </div>
          </li>
          <li className="list-group-item border-0 border-bottom px-0">
            <div className="d-flex flex-wrap align-items-center">
              <h5 className="me-2 mb-0 fw-medium">Опыт :</h5>
              <span className="fs-14 text-muted">10 лет</span>
            </div>
          </li>
          <li className="list-group-item border-0 px-0 pb-0">
            <div className="d-flex flex-wrap align-items-center">
              <h5 className="me-2 mb-0 fw-medium">Языки :</h5>
              <span className="fs-14 text-muted">Английский, Испанский, Немецкий, Японский</span>
            </div>
          </li>
        </ul>
      </CardBody>
    </Card>
  )
}

export default PersonalInfo
