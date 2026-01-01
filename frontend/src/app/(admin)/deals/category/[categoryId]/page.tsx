import { useParams } from 'react-router-dom'
import { Card, CardBody, Col, Row } from 'react-bootstrap'

import PageBreadcrumb from '@/components/layout/PageBreadcrumb'
import PageMetaData from '@/components/PageTitle'
import { useDealCategory } from '@/hooks/useDealCategory'
import { useDealsByCategory } from '@/hooks/useDealsByCategory'
import DealStages from './components/DealStages'
import DealsList from './components/DealsList'

const DealCategoryPage = () => {
  const { categoryId } = useParams<{ categoryId: string }>()
  const { category, loading: categoryLoading, error: categoryError } = useDealCategory(categoryId)
  const { deals, loading: dealsLoading } = useDealsByCategory(categoryId, true)

  // Группируем сделки по стадиям для отображения количества
  const dealsByStage: Record<string, number> = {}
  deals.forEach((deal) => {
    dealsByStage[deal.stage_id] = (dealsByStage[deal.stage_id] || 0) + 1
  })

  if (categoryLoading || dealsLoading) {
    return (
      <>
        <PageBreadcrumb subName="Сделки" title="Загрузка..." />
        <PageMetaData title="Загрузка..." />
        <Card>
          <CardBody className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Загрузка...</span>
            </div>
          </CardBody>
        </Card>
      </>
    )
  }

  if (categoryError || !category) {
    return (
      <>
        <PageBreadcrumb subName="Сделки" title="Ошибка" />
        <PageMetaData title="Ошибка" />
        <Card>
          <CardBody className="text-center py-5">
            <h5 className="text-danger">Ошибка загрузки категории</h5>
            <p className="text-muted">{categoryError || 'Категория не найдена'}</p>
          </CardBody>
        </Card>
      </>
    )
  }

  return (
    <>
      <PageBreadcrumb subName="Сделки" title={category.name} />
      <PageMetaData title={category.name} />

      <Row>
        <Col xs={12}>
          {/* Стадии (воронка) */}
          {category.stages && category.stages.length > 0 && (
            <Card className="mb-4">
              <CardBody>
                <h5 className="mb-3">Воронка продаж</h5>
                <DealStages category={category} dealsByStage={dealsByStage} />
              </CardBody>
            </Card>
          )}

          {/* Список сделок */}
          <Card>
            <CardBody>
              <h5 className="mb-3">Сделки ({deals.length})</h5>
              <DealsList deals={deals} category={category} />
            </CardBody>
          </Card>
        </Col>
      </Row>
    </>
  )
}

export default DealCategoryPage

