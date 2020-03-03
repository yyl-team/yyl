import * as React from 'react'
import { Home } from '~@/page/home/home'

// + declare & interface
export interface RoutesItem {
  title: string
  component: typeof React.Component
  path: string
}
// - declare & interface

export const routes: RoutesItem[] = [{
  title: 'home',
  component: Home,
  path: '/'
}, {
  title: 'home',
  component: Home,
  path: '/home'
}]
