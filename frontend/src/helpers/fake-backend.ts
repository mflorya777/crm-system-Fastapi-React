// Fake backend отключен, используется реальный API
// Если нужны моки для разработки, раскомментируйте код ниже

// import type { UserType } from '@/types/auth'
// import axios from 'axios'
// import MockAdapter from 'axios-mock-adapter'
// 
// const mock = new MockAdapter(axios, { onNoMatch: 'passthrough' })
// 
// export const fakeUsers: UserType[] = [
//   {
//     id: '1',
//     email: 'test@techzaa.in',
//     username: 'demo_user',
//     password: 'password',
//     firstName: 'Demo',
//     lastName: 'User',
//     role: 'User',
//     token: 'fake-token',
//   },
// ]

export default function configureFakeBackend() {
  // Моки отключены, используется реальный API
  // Если нужны моки для других эндпоинтов, добавьте их здесь
}
