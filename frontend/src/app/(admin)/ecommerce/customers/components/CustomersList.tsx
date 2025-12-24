import {
  Button,
  Card,
  CardBody,
  Col,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownToggle,
  Nav,
  NavItem,
  NavLink,
  Row,
  TabContainer,
  TabContent,
  TabPane,
} from 'react-bootstrap'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import CustomersListView from './CustomersListView'
import type { CustomerType } from '@/types/data'
import CustomersGrid from './CustomersGrid'

const CustomersList = ({ customers }: { customers: CustomerType[] }) => {
  return (
    <TabContainer defaultActiveKey={'1'}>
      <Row>
        <Col xs={12}>
          <Card>
            <CardBody>
              <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
                <div>
                  <form className="d-flex flex-wrap align-items-center gap-2">
                    <label htmlFor="inputPassword2" className="visually-hidden">
                      Поиск
                    </label>
                    <div className="search-bar me-3">
                      <span>
                        <IconifyIcon icon="bx:search-alt" className="mb-1" />
                      </span>
                      <input type="search" className="form-control" id="search" placeholder="Поиск ..." />
                    </div>
                    <label htmlFor="status-select" className="me-2">
                      Сортировать по
                    </label>
                    <div className="me-sm-3">
                      <select className="form-select my-1 my-md-0" id="status-select">
                        <option defaultChecked>Все</option>
                        <option value={1}>Имя</option>
                        <option value={2}>Дата регистрации</option>
                        <option value={3}>Телефон</option>
                        <option value={4}>Заказы</option>
                      </select>
                    </div>
                  </form>
                </div>
                <div>
                  <div className="d-flex flex-wrap gap-2 justify-content-md-end align-items-center">
                    <Nav className="nav-pills g-transparent gap-1 p-0">
                      <NavItem>
                      <NavLink eventKey={'0'} title="Сетка" className="flex-centred py-2">
                        <IconifyIcon icon="bx:grid-alt" height={18} width={18} />
                      </NavLink>
                    </NavItem>
                    <NavItem>
                      <NavLink eventKey={'1'} title="Список" className="flex-centred py-2">
                        <IconifyIcon icon="bx:list-ul" height={18} width={18} />
                      </NavLink>
                    </NavItem>
                    </Nav>
                    <Dropdown>
                      <DropdownToggle as={'a'} role="button" className="btn btn-soft-success arrow-none">
                        <IconifyIcon icon="bx:sort" className="me-1" />
                        Фильтр
                      </DropdownToggle>
                      <DropdownMenu className="dropdown-menu-end">
                        <DropdownItem href="">По дате</DropdownItem>
                        <DropdownItem href="">По ID заказа</DropdownItem>
                        <DropdownItem href="">По городу</DropdownItem>
                      </DropdownMenu>
                    </Dropdown>
                    <Button variant="danger" className="icons-center">
                      <IconifyIcon icon="bi:plus" className="me-1" height={18} width={18} />
                      Добавить клиента
                    </Button>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>

      <TabContent className="pt-0">
        <TabPane eventKey={'1'} id="team-list">
          <CustomersListView customers={customers} />
        </TabPane>
        <TabPane eventKey={'0'} id="team-grid">
          <CustomersGrid customers={customers} />
        </TabPane>
      </TabContent>
    </TabContainer>
  )
}

export default CustomersList
