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
import { Plus, Loader2, Image as ImageIcon } from 'lucide-react'
import { upsertProduct } from './actions'
import { toast } from 'sonner'

export default function ProductDialog({ product }: { product?: any }) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(product?.image_url || null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    if (product) formData.append('id', product.id)
    if (product?.image_url) formData.append('existing_image_url', product.image_url)

    const result = await upsertProduct(formData)

    setIsLoading(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(`Product ${product ? 'updated' : 'created'} successfully`)
      setOpen(false)
    }
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {product ? (
          <Button variant="ghost" className="h-8 w-full justify-start px-2">Edit Product</Button>
        ) : (
          <Button className="bg-black hover:bg-gray-800 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{product ? 'Edit Product' : 'Add New Product'}</DialogTitle>
            <DialogDescription>
              Enter the details for your product. Base price should exclude tax.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="flex flex-col items-center gap-4">
              <div className="h-24 w-24 rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center relative overflow-hidden group">
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
                ) : (
                  <ImageIcon className="h-8 w-8 text-gray-400" />
                )}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Label htmlFor="image" className="cursor-pointer text-white text-xs font-medium">
                    Change
                  </Label>
                </div>
              </div>
              <Input 
                id="image" 
                name="image" 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleImageChange}
              />
              <p className="text-xs text-gray-500">Upload product image (JPG, PNG, WEBP)</p>
            </div>

            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Product Name</Label>
                <Input id="name" name="name" defaultValue={product?.name} placeholder="e.g. Premium Office Desk" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" defaultValue={product?.description} placeholder="Short description for the quote..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="price">Base Price (₹)</Label>
                  <Input id="price" name="price" type="number" step="0.01" defaultValue={product?.price} placeholder="0.00" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="tax_percent">Default Tax (%)</Label>
                  <Input id="tax_percent" name="tax_percent" type="number" step="0.01" defaultValue={product?.tax_percent || 0} placeholder="18" required />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="active" 
                  name="active" 
                  value="true" 
                  defaultChecked={product ? product.active : true}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="active" className="text-sm font-medium">Product is active</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="submit" 
              className="bg-black hover:bg-gray-800 text-white w-full h-11"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                product ? 'Update Product' : 'Create Product'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
