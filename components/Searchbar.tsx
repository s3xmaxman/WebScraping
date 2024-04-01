'use client'
import React, { FormEvent, useState } from 'react'

const isValidAmazonProductUrl = (url: string) => {
    try {
        const parsedUrl = new URL(url)
        const hostname = parsedUrl.hostname

        if(hostname.includes('amazon.com') || hostname.includes('amazon') || hostname.endsWith('amazon')) {
            return true
        }
    } catch (error) {
        return false
    }

    return false
}

const Searchbar = () => {
  const [searchPrompt, setSearchPrompt] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()

      const  isValidLink = isValidAmazonProductUrl(searchPrompt)

      if(!isValidLink) {
        return alert('Please enter a valid Amazon product link')
      }

      try {
        setIsLoading(true)
      } catch (error) {
        
      } finally {
        setIsLoading(false)
      }
  }  
  return (
    <form 
        onSubmit={handleSubmit}
        className='flex flex-warp gap-4 mt-12'
    >
        <input 
            type="text"
            value={searchPrompt}
            onChange={(e) => setSearchPrompt(e.target.value)}
            placeholder='Enter product Link' 
            className='searchbar-input'
        />
        <button 
            type='submit' 
            className='searchbar-btn'
            disabled={searchPrompt === ''}
        >
            {isLoading ? 'Searching...' : 'Search'}
        </button>
    </form>
  )
}

export default Searchbar