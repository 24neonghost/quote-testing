'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Loader2, Image as ImageIcon, Trash2 } from 'lucide-react'
import { upsertProduct } from './actions'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Spec {
  key: string
  value: string
}

interface Product {
  id: string
  name: string
  description: string
  price: number
  tax_percent: number
  image_url: string | null
  active: boolean
  image_format?: 'wide' | 'tall'
  sku?: string
  category?: string
  specs?: Spec[]
}

export default function ProductDialog({ product }: { product?: Product }) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(product?.image_url || null)
  const [specs, setSpecs] = useState<Spec[]>(product?.specs || [])

  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)

    const form = e.currentTarget
    const formData = new FormData(form)

    // Ensure ID is passed for updates
    if (product?.id) {
      formData.append('id', product.id)
    }

    // Client-side image upload
    const imageInput = form.querySelector('input[type="file"]') as HTMLInputElement
    const file = imageInput?.files?.[0]
    let imageUrl = product?.image_url

    if (file) {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `product-images/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, file)

      if (uploadError) {
        toast.error("Image upload failed: " + uploadError.message)
        setIsLoading(false)
        return
      }

      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(filePath)

      imageUrl = publicUrl
    }

    if (imageUrl) {
      formData.set('image_url', imageUrl)
    }

    // Add specs as JSON string
    formData.set('specs', JSON.stringify(specs))
    formData.delete('image') // Don't send file to server action

    try {
      const result = await upsertProduct(formData)

      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success(`Product ${product ? 'updated' : 'created'} successfully`)
        setOpen(false)
      }
    } catch (error) {
      console.error(error)
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const addSpec = () => setSpecs([...specs, { key: '', value: '' }])
  const removeSpec = (index: number) => setSpecs(specs.filter((_, i) => i !== index))
  const updateSpec = (index: number, field: keyof Spec, value: string) => {
    const newSpecs = [...specs]
    newSpecs[index][field] = value
    setSpecs(newSpecs)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {product ? (
          <Button variant="ghost" size="sm" className="h-10 w-full justify-start px-3 text-base font-medium text-gray-600 hover:text-black hover:bg-gray-50">
            Edit
          </Button>
        ) : (
          <Button className="h-12 gap-2 rounded-xl bg-black px-6 text-lg font-bold text-white hover:bg-gray-900 shadow-lg shadow-black/20 transition-all">
            <Plus className="h-5 w-5" />
            Add Product
          </Button>
        )}
      </DialogTrigger>
      
      {/* THE FIX: Added `sm:max-w-[95vw]` to override the sm:max-w-lg default in dialog.tsx.
        Now it will stretch out to 95% of the screen width and height! 
      */}
      <DialogContent className="max-w-[95vw] sm:max-w-[95vw] w-full gap-0 p-0 overflow-hidden rounded-2xl border-none bg-white shadow
