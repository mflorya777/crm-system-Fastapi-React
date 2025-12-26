import { useEffect, useState } from 'react'
import {
  Button,
  Card,
  CardBody,
  CardTitle,
  Dropdown,
  DropdownDivider,
  DropdownHeader,
  DropdownItem,
  DropdownMenu,
  DropdownToggle,
  OverlayTrigger,
  TabPane,
  Tooltip,
} from 'react-bootstrap'
import * as yup from 'yup'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'

import { getNewFeedPosts } from '@/helpers/data'
import type { SocialPostType } from '@/types/data'
import PostCard from './PostCard'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import TextAreaFormInput from '@/components/form/TextAreaFormInput'

const CreatePost = () => {
  const createPostSchema = yup.object({
    caption: yup.string().required(),
  })

  const { handleSubmit, control } = useForm({
    resolver: yupResolver(createPostSchema),
  })

  return (
    <Card>
      <CardBody as="form" onSubmit={handleSubmit(() => {})}>
        <div className="icons-center w-100 mb-3">
          <CardTitle className="me-auto">Создать публикацию</CardTitle>
          <Dropdown className="float-end" align="end">
            <DropdownToggle as="span" role="button" className="arrow-none text-dark">
              <IconifyIcon icon="bx:slider-alt" className="fs-18" />
            </DropdownToggle>
            <DropdownMenu>
              <DropdownHeader className="text-center fs-14">Фильтры публикации</DropdownHeader>
              <DropdownDivider className="mt-0" />
              <DropdownItem className="d-flex align-items-center">
                <div className="flex-shrink-0">
                  <IconifyIcon icon="bx:bookmark" className="fs-18 align-middle me-2" />
                </div>
                <div className="flex-grow-1">
                  <p className="mb-0">Сохранить ссылку</p>
                  <small className="text-muted">Добавить в сохранённые</small>
                </div>
              </DropdownItem>
              <DropdownItem className="d-flex align-items-center">
                <div className="flex-shrink-0">
                  <IconifyIcon icon="bx:bell-off" className="fs-18 align-middle me-2" />
                </div>
                <div className="flex-grow-1">
                  <p className="mb-0">Уведомления</p>
                  <small className="text-muted">Отключить уведомления для этой публикации</small>
                </div>
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
        <div className="d-md-flex mb-2">
          <Dropdown className="me-1">
            <DropdownToggle as="span" className="btn btn-outline-light text-dark content-none">
              Кто может видеть вашу публикацию?
              <IconifyIcon icon="bx:chevron-down" className="ms-1" />
            </DropdownToggle>
            <DropdownMenu>
              <li>
                <DropdownItem>
                  <IconifyIcon icon="bx:globe-alt" className="me-1" />
                  Публично
                </DropdownItem>
              </li>
              <li>
                <DropdownItem>
                  <IconifyIcon icon="bx:user" className="me-1" />
                  Друзья
                </DropdownItem>
              </li>
              <li>
                <DropdownItem>
                  <IconifyIcon icon="bx:user-check" className="me-1" />
                  Друзья, кроме...
                </DropdownItem>
              </li>
            </DropdownMenu>
          </Dropdown>
          <Dropdown className="mt-1 mt-md-0">
            <DropdownToggle as="span" className="btn btn-outline-light text-dark content-none">
              <IconifyIcon icon="bx:plus" className="me-1" />
              Альбом
              <IconifyIcon icon="bx:chevron-down" className="ms-1" />
            </DropdownToggle>
            <DropdownMenu>
              <li>
                <DropdownItem>
                  <IconifyIcon icon="bx-images" className="me-1" />
                  Без названия
                </DropdownItem>
              </li>
              <li>
                <DropdownItem>
                  <IconifyIcon icon="bx-images" className="me-1" />
                  Моя мечта
                </DropdownItem>
              </li>
              <li>
                <DropdownItem>
                  <IconifyIcon icon="bx-images" className="me-1" />
                  История путешествий
                </DropdownItem>
              </li>
            </DropdownMenu>
          </Dropdown>
        </div>

        <TextAreaFormInput control={control} name="caption" containerClassName="mb-3" placeholder="О чём вы думаете?" />

        <div className="d-flex gap-1">
          <OverlayTrigger overlay={<Tooltip>Фото / Видео</Tooltip>}>
            <Button variant="outline-light" size="sm" className="text-dark flex-centered fs-16" title="Фото / Видео">
              <IconifyIcon icon="bx:images" className="bx-images" />
            </Button>
          </OverlayTrigger>

          <OverlayTrigger overlay={<Tooltip>Отметить людей</Tooltip>}>
            <Button variant="outline-light" size="sm" className="text-dark flex-centered fs-16" title="Отметить людей">
              <IconifyIcon icon="bxs:user-plus" className="bxs-user-plus" />
            </Button>
          </OverlayTrigger>

          <OverlayTrigger overlay={<Tooltip>Настроение / Активность</Tooltip>}>
            <Button variant="outline-light" size="sm" className="text-dark flex-centered fs-16" title="Настроение / Активность">
              <IconifyIcon icon="bxs:smile" className="bxs-smile" />
            </Button>
          </OverlayTrigger>

          <OverlayTrigger overlay={<Tooltip>Отметить место</Tooltip>}>
            <Button variant="outline-light" size="sm" className="text-dark flex-centered fs-16" title="Отметить место">
              <IconifyIcon icon="bxs:location-plus" className="bxs-location-plus" />
            </Button>
          </OverlayTrigger>

          <OverlayTrigger overlay={<Tooltip>Камера</Tooltip>}>
            <Button variant="outline-light" size="sm" className="text-dark flex-centered fs-16" title="Камера">
              <IconifyIcon icon="bxs:camera" className="bxs-camera" />
            </Button>
          </OverlayTrigger>
          <button type="submit" className="btn btn-primary ms-auto">
            Опубликовать
          </button>
        </div>
      </CardBody>
    </Card>
  )
}

const FeedTab = () => {
  const [feedPosts, setFeedPosts] = useState<SocialPostType[]>()

  useEffect(() => {
    const fetchFeedPosts = async () => {
      const posts = await getNewFeedPosts()
      if (posts) setFeedPosts(posts)
    }
    fetchFeedPosts()
  }, [])

  return (
    <TabPane eventKey="Feed" className="fade" role="tabpanel" aria-labelledby="social-feed-tab">
      <CreatePost />

      {feedPosts ? feedPosts.map((post) => <PostCard key={post.id} {...post} />) : <h4 className="text-center ">Похоже, ваши друзья ленивы</h4>}

      <span className="text-primary d-flex justify-content-center mx-auto mb-3">
        <IconifyIcon icon="bx:loader-circle" className="spin-icon fs-22 align-middle me-1" />
        Загрузка
      </span>
    </TabPane>
  )
}

export default FeedTab
