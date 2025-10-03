import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import App from './App.jsx'
import Home from './pages/Home.jsx'
import NewListing from './pages/NewListing.jsx'
import Show from './pages/Show.jsx'
import Login from './pages/Login.jsx'
import './index.css'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: 'new', element: <NewListing /> },
      { path: 'listing/:id', element: <Show /> },
      { path: 'login', element: <Login /> },         // ← add
    ],
  },
])

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
