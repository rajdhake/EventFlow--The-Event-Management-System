import React from 'react'
import { Link, NavLink } from 'react-router-dom'
import Brand from './Brand'

function Footer() {
  return (
    <div className='flex flex-col gap-4 md:gap-8 py-12 bg-secondary text-neutral-200 font-poppins border-t border-neutral-400'>
    <div className='w-full flex flex-row items-start uppercase gap-4 justify-between container'>
        <div className='flex flex-col items-start gap-2'>
            <Brand/>
            {/* <p className='font-medium capitalize text-md '>Subtitle Lorem Ipsum!</p> */}
        </div>
        <ul className='flex flex-col items-start gap-1'> 
            <NavLink  className='font-light text-sm ' to={'/explore'}>Explore</NavLink>
            <NavLink  className='font-light text-sm ' to={`/dashboard`}>Dashboard</NavLink>
        </ul>
    </div>
    <hr className='bg-neutral-100 border border-neutral-100 opacity-25'></hr>
    <div>
        <p className='text-neutral-300 text-xs md:text-sm text-center'>&copy; Unknown {new Date().getFullYear()} | All rights reserved</p>
    </div>
    </div>
  )
}

export default Footer