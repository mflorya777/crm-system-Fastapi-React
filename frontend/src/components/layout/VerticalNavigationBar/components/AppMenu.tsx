import clsx from 'clsx'
import { Fragment, useCallback, useEffect, useState, type MouseEvent } from 'react'
import { Collapse } from 'react-bootstrap'
import { Link, useLocation } from 'react-router-dom'

import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { findAllParent, findMenuItem, getMenuItemFromURL } from '@/helpers/menu'
import type { MenuItemType, SubMenus } from '@/types/menu'

const MenuItemWithChildren = ({
  item,
  className,
  linkClassName,
  subMenuClassName,
  activeMenuItems,
  toggleMenu,
  onAddCategoryClick,
}: SubMenus & { onAddCategoryClick?: () => void }) => {
  const [open, setOpen] = useState<boolean>(activeMenuItems!.includes(item.key))

  useEffect(() => {
    setOpen(activeMenuItems!.includes(item.key))
  }, [activeMenuItems, item])

  const toggleMenuItem = (e: MouseEvent<HTMLParagraphElement>) => {
    e.preventDefault()
    const status = !open
    setOpen(status)
    if (toggleMenu) toggleMenu(item, status)
    return false
  }

  const getActiveClass = useCallback(
    (item: MenuItemType) => {
      return activeMenuItems?.includes(item.key) ? 'active' : ''
    },
    [activeMenuItems],
  )

  return (
    <li className={className}>
      <div onClick={toggleMenuItem} aria-expanded={open} role="button" className={clsx(linkClassName)}>
        {item.icon && (
          <span className="nav-icon">
            {' '}
            <IconifyIcon icon={item.icon} />{' '}
          </span>
        )}
        <span className="nav-text">{item.label}</span>
        {!item.badge ? (
          <IconifyIcon icon="bx:chevron-down" className="menu-arrow" />
        ) : (
          <span className={`badge badge-pill text-end bg-${item.badge.variant}`}>{item.badge.text}</span>
        )}
      </div>
      <Collapse in={open}>
        <div>
          <ul className={clsx(subMenuClassName)}>
            {(item.children || []).map((child, idx) => {
              return (
                <Fragment key={child.key + idx}>
                  {child.children ? (
                    <MenuItemWithChildren
                      item={child}
                      linkClassName={clsx('nav-link', getActiveClass(child))}
                      activeMenuItems={activeMenuItems}
                      className="sub-nav-item"
                      subMenuClassName="nav sub-navbar-nav"
                      toggleMenu={toggleMenu}
                      onAddCategoryClick={onAddCategoryClick}
                    />
                  ) : (
                    <MenuItem
                      item={child}
                      className="sub-nav-item"
                      linkClassName={clsx('sub-nav-link', getActiveClass(child))}
                      onAddCategoryClick={onAddCategoryClick}
                    />
                  )}
                </Fragment>
              )
            })}
          </ul>
        </div>
      </Collapse>
    </li>
  )
}

const MenuItem = ({ item, className, linkClassName, onAddCategoryClick }: SubMenus & { onAddCategoryClick?: () => void }) => {
  return (
    <li className={className}>
      <MenuItemLink item={item} className={linkClassName} onAddCategoryClick={onAddCategoryClick} />
    </li>
  )
}

const MenuItemLink = ({ item, className, onAddCategoryClick }: SubMenus & { onAddCategoryClick?: () => void }) => {
  // Обработка клика на "Добавить категорию +"
  if (item.key === 'deals-add-category' && item.url === '#') {
    return (
      <span
        role="button"
        onClick={(e) => {
          e.preventDefault()
          if (onAddCategoryClick) {
            onAddCategoryClick()
          }
        }}
        className={clsx(className, { disabled: item.isDisabled })}
        style={{ cursor: 'pointer' }}>
        {item.icon && (
          <span className="nav-icon">
            <IconifyIcon icon={item.icon} />
          </span>
        )}
        <span className="nav-text">{item.label}</span>
        {item.badge && <span className={`badge badge-pill text-end bg-${item.badge.variant}`}>{item.badge.text}</span>}
      </span>
    )
  }

  return (
    <Link to={item.url ?? ''} target={item.target} className={clsx(className, { disabled: item.isDisabled })}>
      {item.icon && (
        <span className="nav-icon">
          <IconifyIcon icon={item.icon} />
        </span>
      )}
      <span className="nav-text">{item.label}</span>
      {item.badge && <span className={`badge badge-pill text-end bg-${item.badge.variant}`}>{item.badge.text}</span>}
    </Link>
  )
}

type AppMenuProps = {
  menuItems: Array<MenuItemType>
  onAddCategoryClick?: () => void
}

const AppMenu = ({ menuItems, onAddCategoryClick }: AppMenuProps) => {
  const { pathname } = useLocation()

  const [activeMenuItems, setActiveMenuItems] = useState<Array<string>>([])
  const toggleMenu = (menuItem: MenuItemType, show: boolean) => {
    if (show) setActiveMenuItems([menuItem.key, ...findAllParent(menuItems, menuItem)])
  }

  const getActiveClass = useCallback(
    (item: MenuItemType) => {
      return activeMenuItems?.includes(item.key) ? 'active' : ''
    },
    [activeMenuItems],
  )

  const activeMenu = useCallback(() => {
    const trimmedURL = pathname?.replaceAll('', '')
    const matchingMenuItem = getMenuItemFromURL(menuItems, trimmedURL)

    if (matchingMenuItem) {
      const activeMt = findMenuItem(menuItems, matchingMenuItem.key)
      if (activeMt) {
        setActiveMenuItems([activeMt.key, ...findAllParent(menuItems, activeMt)])
      }

      setTimeout(() => {
        const activatedItem: HTMLAnchorElement | null = document.querySelector(`#leftside-menu-container .simplebar-content a[href="${trimmedURL}"]`)
        if (activatedItem) {
          const simplebarContent = document.querySelector('#leftside-menu-container .simplebar-content-wrapper')
          if (simplebarContent) {
            const offset = activatedItem.offsetTop - window.innerHeight * 0.4
            scrollTo(simplebarContent, offset, 600)
          }
        }
      }, 400)

      // scrollTo (Left Side Bar Active Menu)
      const easeInOutQuad = (t: number, b: number, c: number, d: number) => {
        t /= d / 2
        if (t < 1) return (c / 2) * t * t + b
        t--
        return (-c / 2) * (t * (t - 2) - 1) + b
      }

      const scrollTo = (element: Element, to: number, duration: number) => {
        const start = element.scrollTop,
          change = to - start,
          increment = 20
        let currentTime = 0
        const animateScroll = function () {
          currentTime += increment
          const val = easeInOutQuad(currentTime, start, change, duration)
          element.scrollTop = val
          if (currentTime < duration) {
            setTimeout(animateScroll, increment)
          }
        }
        animateScroll()
      }
    }
  }, [pathname, menuItems])

  useEffect(() => {
    if (menuItems && menuItems.length > 0) activeMenu()
  }, [activeMenu, menuItems])

  return (
    <ul className="navbar-nav">
      {(menuItems || []).map((item, idx) => {
        return (
          <Fragment key={item.key + idx}>
            {item.isTitle ? (
              <li className="menu-title">{item.label}</li>
            ) : (
              <>
                {item.children ? (
                  <MenuItemWithChildren
                    item={item}
                    toggleMenu={toggleMenu}
                    className="nav-item"
                    linkClassName={clsx('nav-link', getActiveClass(item))}
                    subMenuClassName="nav sub-navbar-nav"
                    activeMenuItems={activeMenuItems}
                    onAddCategoryClick={onAddCategoryClick}
                  />
                ) : (
                  <MenuItem
                    item={item}
                    linkClassName={clsx('nav-link', getActiveClass(item))}
                    className="nav-item"
                    onAddCategoryClick={onAddCategoryClick}
                  />
                )}
              </>
            )}
          </Fragment>
        )
      })}
    </ul>
  )
}

export default AppMenu
