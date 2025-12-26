import { Button, Col, Offcanvas, OffcanvasBody, OffcanvasHeader, Row } from 'react-bootstrap'

import SimplebarReactClient from './wrappers/SimplebarReactClient'
import type { MenuType, OffcanvasControlType, ThemeType } from '@/types/context'
import { useLayoutContext } from '@/context/useLayoutContext'
import { getThemeName } from '@/utils/other'

const ColorScheme = () => {
  const { theme, changeTheme } = useLayoutContext()
  const modes: ThemeType[] = ['light', 'dark']
  return (
    <div>
      <h5 className="mb-3 font-16 fw-semibold">Цветовая схема</h5>
      {modes.map((mode, idx) => (
        <div key={mode + idx} className="form-check mb-2">
          <input
            className="form-check-input"
            type="radio"
            name="data-bs-theme"
            id={`layout-color-${mode}`}
            onChange={() => changeTheme(mode)}
            checked={theme === mode}
          />
          <label className="form-check-label" htmlFor={`layout-color-${mode}`}>
            {getThemeName(mode)}
          </label>
        </div>
      ))}
    </div>
  )
}

const TopbarTheme = () => {
  const { topbarTheme, changeTopbarTheme } = useLayoutContext()
  const modes: ThemeType[] = ['light', 'dark']
  return (
    <div>
      <h5 className="my-3 font-16 fw-semibold">Цвет верхней панели</h5>
      {modes.map((mode, idx) => (
        <div key={idx + mode} className="form-check mb-2">
          <input
            className="form-check-input"
            type="radio"
            name="data-topbar-color"
            id={`topbar-color-${mode}`}
            onChange={() => changeTopbarTheme(mode)}
            checked={topbarTheme === mode}
          />
          <label className="form-check-label" htmlFor={`topbar-color-${mode}`}>
            {getThemeName(mode)}
          </label>
        </div>
      ))}
    </div>
  )
}

const MenuTheme = () => {
  const {
    menu: { theme },
    changeMenu: { theme: changeMenuTheme },
  } = useLayoutContext()
  const modes: ThemeType[] = ['light', 'dark']
  return (
    <div>
      <h5 className="my-3 font-16 fw-semibold">Цвет меню</h5>
      {modes.map((mode, idx) => (
        <div key={idx + mode + idx} className="form-check mb-2">
          <input
            className="form-check-input"
            type="radio"
            name="data-menu-color"
            id={`leftbar-color-${mode}`}
            onChange={() => changeMenuTheme(mode)}
            checked={theme === mode}
          />
          <label className="form-check-label" htmlFor={`leftbar-color-${mode}`}>
            {getThemeName(mode)}
          </label>
        </div>
      ))}
    </div>
  )
}

const SidebarSize = () => {
  const {
    menu: { size: menuSize },
    changeMenu: { size: changeMenuSize },
  } = useLayoutContext()
  const sizes: { size: MenuType['size']; name: string }[] = [
    {
      name: 'По умолчанию',
      size: 'default',
    },
    {
      name: 'Сжатый',
      size: 'condensed',
    },
    {
      name: 'Скрытый',
      size: 'hidden',
    },
    {
      name: 'Маленький при наведении активный',
      size: 'sm-hover-active',
    },
    {
      name: 'Маленький при наведении',
      size: 'sm-hover',
    },
  ]

  return (
    <div>
      <h5 className="my-3 font-16 fw-semibold">Размер боковой панели</h5>
      {sizes.map((size, idx) => (
        <div key={size.size + idx} className="form-check mb-2">
          <input
            className="form-check-input"
            type="radio"
            name="data-menu-size"
            id={`leftbar-size-${size.size}`}
            onChange={() => changeMenuSize(size.size)}
            checked={menuSize === size.size}
          />
          <label className="form-check-label" htmlFor={`leftbar-size-${size.size}`}>
            {size.name}
          </label>
        </div>
      ))}
    </div>
  )
}

const ThemeCustomizer = ({ open, toggle }: OffcanvasControlType) => {
  const { resetSettings, theme } = useLayoutContext()

  return (
    <div>
      <Offcanvas placement="end" show={open} onHide={toggle} className="border-0" tabIndex={-1}>
        <OffcanvasHeader closeVariant="white" closeButton className="d-flex align-items-center bg-primary p-3">
          <h5 className="text-white m-0">Настройки темы</h5>
        </OffcanvasHeader>
        <OffcanvasBody className="p-0">
          <SimplebarReactClient className="h-100">
            <div className="p-3 settings-bar">
              <ColorScheme />

              {theme === 'light' && <TopbarTheme />}

              {theme === 'light' && <MenuTheme />}

              <SidebarSize />
            </div>
          </SimplebarReactClient>
        </OffcanvasBody>
        <div className="offcanvas-footer border-top p-3 text-center">
          <Row>
            <Col>
              <Button variant="danger" onClick={resetSettings} className="w-100">
                Сбросить
              </Button>
            </Col>
          </Row>
        </div>
      </Offcanvas>
    </div>
  )
}

export default ThemeCustomizer
