import { Row } from 'react-bootstrap'

import PageBreadcrumb from '@/components/layout/PageBreadcrumb'
import PageMetaData from '@/components/PageTitle'
import SocialView from './components/SocialView'

const Social = () => {
  return (
    <>
      <PageBreadcrumb title="Социальная сеть" subName="Приложения" />
      <PageMetaData title="Социальная сеть" />

      <Row className="justify-content-center">
        <SocialView />
      </Row>
    </>
  )
}

export default Social
