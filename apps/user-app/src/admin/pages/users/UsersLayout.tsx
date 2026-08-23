import React from 'react'
import { Outlet } from 'react-router-dom'

const UsersLayout = () => {
  return (
    <div>
        <Outlet />
    </div>
  )
}

export default UsersLayout