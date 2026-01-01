import { Col, Row } from 'react-bootstrap'

import PageBreadcrumb from '@/components/layout/PageBreadcrumb'
import PageMetaData from '@/components/PageTitle'
import AboutCard from './components/AboutCard'
import Activity from './components/Activity'
import Messages from './components/Messages'
import PersonalInfo from './components/PersonalInfo'

const Profile = () => {
  return (
    <>
      <PageBreadcrumb subName="" title="Профиль" />
      <PageMetaData title="Профиль" />

      <Row>
        <Col xxl={4}>
          <Row>
            <Col xs={12}>
              <AboutCard />
            </Col>
          </Row>
          <Row>
            <Col xs={12}>
              <Activity />
            </Col>
          </Row>
        </Col>
        <Col xxl={8}>
          <Row>
            <Col xs={12}>
              <PersonalInfo />
            </Col>
          </Row>
          <Row>
            <Col xs={12}>
              <Messages />
            </Col>
          </Row>
        </Col>
      </Row>
    </>
  )
}

export default Profile
