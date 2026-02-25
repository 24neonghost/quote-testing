import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"

interface PDFData {
  quotation: any
  items: any[]
  settings: any
  user: any
  selectedTerms?: { title: string; text: string }[]
  currency?: 'INR' | 'USD'
  validityData?: { validityDate?: string; validityDays?: number }
}

export const generateQuotationPDF = async ({
  quotation,
  items,
  settings,
  user,
  selectedTerms,
  currency = 'INR',
  validityData
}: PDFData) => {

  const doc = new jsPDF("portrait", "mm", "a4")

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  const margin = 15
  const safeBottom = pageHeight - 30

  const currencySymbol = currency === "INR" ? "Rs." : "$"
  const currencyLabel = currency === "INR" ? "INR" : "USD"

  let pageNumber = 1

  //--------------------------------------------------
  // BORDER + FOOTER
  //--------------------------------------------------

  const drawPageBorder = () => {

    doc.setDrawColor(0, 82, 156)
    doc.setLineWidth(1.2)
    doc.rect(5, 5, pageWidth - 10, pageHeight - 10)

    doc.setDrawColor(255, 102, 0)
    doc.setLineWidth(0.8)
    doc.rect(7, 7, pageWidth - 14, pageHeight - 14)

    doc.setDrawColor(0)
    doc.setLineWidth(0.3)
    doc.rect(margin + 10, pageHeight - 20, pageWidth - (margin * 2) - 20, 8)

    doc.setFont("helvetica", "bold")
    doc.setFontSize(8)

    doc.text(
      "Write us: info@raiselabequip.com / sales@raiselabequip.com | Contact: +91 91777 70365",
      pageWidth / 2,
      pageHeight - 14.5,
      { align: "center" }
    )
  }

  //--------------------------------------------------
  // HEADER
  //--------------------------------------------------

  const drawHeader = (logo: string) => {

    if (logo)
      doc.addImage(logo, "JPEG", margin, 12, 70, 25)

    doc.setFont("helvetica", "bold")
    doc.setFontSize(11)
    doc.setTextColor(0, 82, 156)

    doc.text("RAISE LAB EQUIPMENT", pageWidth - margin, 18, { align: "right" })

    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)
    doc.setTextColor(60)

    doc.text(
      "C-6, B1, Industrial Park, Moula Ali,\nHyderabad, Secunderabad,\nTelangana 500040",
      pageWidth - margin,
      24,
      { align: "right" }
    )

    doc.setDrawColor(0, 82, 156)
    doc.setLineWidth(0.5)
    doc.line(margin, 42, pageWidth - margin, 42)

    doc.setDrawColor(255, 102, 0)
    doc.setLineWidth(0.3)
    doc.line(margin, 43, pageWidth - margin, 43)
  }

  //--------------------------------------------------
  // PAGE NUMBER
  //--------------------------------------------------

  const drawPageNumber = () => {

    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)
    doc.setTextColor(0)

    doc.text(
      `Page ${pageNumber}`,
      pageWidth - margin,
      pageHeight - 8,
      { align: "right" }
    )
  }

  //--------------------------------------------------
  // NEW PAGE
  //--------------------------------------------------

  const newPage = (logo: string) => {

    doc.addPage()

    pageNumber++

    drawPageBorder()
    drawHeader(logo)
    drawPageNumber()

    doc.setTextColor(0)
  }

  //--------------------------------------------------
  // LOAD LOGO
  //--------------------------------------------------

  let logoBase64 = ""

  try {
    logoBase64 = await getBase64ImageFromURL("/quotation-logo.jpg")
  } catch {}

  //--------------------------------------------------
  // LOAD ITEM IMAGES
  //--------------------------------------------------

  const images: Record<string, any> = {}

  await Promise.all(
    items.map(async (item) => {

      if (!item.image_url) return

      try {
        images[item.id] =
          await getBase64ImageWithDimensions(item.image_url)
      } catch {}

    })
  )

  //--------------------------------------------------
  // START FIRST PAGE
  //--------------------------------------------------

  drawPageBorder()
  drawHeader(logoBase64)
  drawPageNumber()

  let y = 50

  //--------------------------------------------------
  // ITEMS LOOP
  //--------------------------------------------------

  for (let i = 0; i < items.length; i++) {

    const item = items[i]

    if (i > 0) {
      newPage(logoBase64)
      y = 50
    }

    //--------------------------------------------------
    // TITLE
    //--------------------------------------------------

    doc.setFont("helvetica", "bold")
    doc.setFontSize(14)
    doc.setTextColor(0, 82, 156)

    doc.text("Technical & Commercial Offer", pageWidth / 2, y, { align: "center" })

    y += 8

    doc.setFontSize(12)
    doc.setTextColor(0)

    doc.text(`For ${item.name}`, pageWidth / 2, y, { align: "center" })

    y += 12

    //--------------------------------------------------
    // DESCRIPTION
    //--------------------------------------------------

    doc.setFont("helvetica", "bold")
    doc.setFontSize(10)

    doc.text("Description:", margin, y)

    y += 6

    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)

    const desc = doc.splitTextToSize(item.description || "", pageWidth - margin * 2)

    doc.text(desc, margin, y)

    y += desc.length * 5 + 8

    //--------------------------------------------------
    // FEATURES + IMAGE
    //--------------------------------------------------

    const image = images[item.id]
    const format = item.image_format || "wide"

    const features = item.features || []

    if (format === "wide") {

      if (image) {

        const maxWidth = pageWidth - margin * 2 - 30
        const ratio = maxWidth / image.width

        const w = image.width * ratio
        const h = image.height * ratio

        const x = margin + 15

        doc.addImage(image.base64, "JPEG", x, y, w, h)

        y += h + 10
      }

      doc.setFont("helvetica", "bold")
      doc.text("FEATURES:", margin, y)

      y += 6

      doc.setFont("helvetica", "normal")

      for (const f of features) {

        const lines = doc.splitTextToSize(f, pageWidth - margin * 2 - 10)

        doc.text("•", margin + 2, y)
        doc.text(lines, margin + 7, y)

        y += lines.length * 5
      }

      y += 8

    } else {

      const leftWidth = pageWidth * 0.55

      const startY = y

      doc.setFont("helvetica", "bold")
      doc.text("FEATURES:", margin, y)

      y += 6

      doc.setFont("helvetica", "normal")

      let featureY = y

      for (const f of features) {

        const lines = doc.splitTextToSize(f, leftWidth - 10)

        doc.text("•", margin + 2, featureY)
        doc.text(lines, margin + 7, featureY)

        featureY += lines.length * 5
      }

      if (image) {

        const maxWidth = pageWidth * 0.35

        const ratio = maxWidth / image.width

        const w = image.width * ratio
        const h = image.height * ratio

        const imgX = margin + leftWidth + 10

        doc.addImage(image.base64, "JPEG", imgX, startY, w, h)

        y = Math.max(featureY, startY + h) + 10

      } else {
        y = featureY + 10
      }
    }

    //--------------------------------------------------
    // SPECIFICATIONS (FIXED)
    //--------------------------------------------------

    if (item.specs?.length) {

      if (y > safeBottom) {
        newPage(logoBase64)
        y = 50
      }

      doc.setFont("helvetica", "bold")
      doc.text("Specifications:", margin, y)

      y += 6

      doc.setFont("helvetica", "normal")

      for (const s of item.specs) {

        const text = `${s.key}: ${s.value}`

        const lines = doc.splitTextToSize(text, pageWidth - margin * 2)

        doc.text("•", margin + 2, y)
        doc.text(lines, margin + 7, y)

        y += lines.length * 5
      }

      y += 10
    }

    //--------------------------------------------------
    // COMMERCIAL OFFER (FIXED)
    //--------------------------------------------------

    if (y > safeBottom) {
      newPage(logoBase64)
      y = 50
    }

    doc.setFont("helvetica", "bold")
    doc.text("Commercial Offer:", margin, y)

    y += 6

    autoTable(doc, {

      startY: y,

      head: [["S.No", "Description", "Qty", `Price (${currencyLabel})`]],

      body: [[
        "01",
        item.name,
        "1",
        `${currencySymbol} ${item.price.toLocaleString('en-IN')}/-`
      ]],

      margin: { left: margin, right: margin },

      headStyles: {
        fillColor: [0, 82, 156],
        textColor: [255, 255, 255]
      }
    })

    y = (doc as any).lastAutoTable.finalY + 15
  }

  //--------------------------------------------------
  // TERMS PAGE
  //--------------------------------------------------

  newPage(logoBase64)

  let y2 = 55

  doc.setFont("helvetica", "bold")
  doc.setFontSize(12)

  doc.text("Terms And Conditions:", margin, y2)

  y2 += 10

  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)

  const terms = selectedTerms || []

  for (const t of terms) {

    const txt = `${t.title}: ${t.text}`

    const lines = doc.splitTextToSize(txt, pageWidth - margin * 2)

    doc.text("•", margin, y2)
    doc.text(lines, margin + 5, y2)

    y2 += lines.length * 5 + 2
  }

  //--------------------------------------------------
  // SIGNATURE (FIXED)
  //--------------------------------------------------

  y2 += 15

  doc.setFont("helvetica", "bold")

  doc.text(
    `From ${settings?.company_name || "Raise Lab Equipment"}`,
    pageWidth - margin,
    y2,
    { align: "right" }
  )

  y2 += 6

  doc.text(
    user?.full_name || "Sales Team",
    pageWidth - margin,
    y2,
    { align: "right" }
  )

  y2 += 6

  doc.setFont("helvetica", "normal")

  doc.text(
    `Contact: ${user?.phone || "+91 91777 70365"}`,
    pageWidth - margin,
    y2,
    { align: "right" }
  )

  //--------------------------------------------------
  // SAVE
  //--------------------------------------------------

  doc.save(`${quotation.quotation_number}_Quotation.pdf`)

  return doc.output("blob")
}






// IMAGE HELPERS

const getBase64ImageFromURL = (url: string): Promise<string> =>
  new Promise((resolve, reject) => {

    const img = new Image()

    img.crossOrigin = "anonymous"

    img.onload = () => {

      const canvas = document.createElement("canvas")

      canvas.width = img.width
      canvas.height = img.height

      const ctx = canvas.getContext("2d")

      ctx?.drawImage(img, 0, 0)

      resolve(canvas.toDataURL("image/jpeg", 0.85))
    }

    img.onerror = reject

    img.src = url
  })


const getBase64ImageWithDimensions = (url: string): Promise<any> =>
  new Promise((resolve, reject) => {

    const img = new Image()

    img.crossOrigin = "anonymous"

    img.onload = () => {

      const canvas = document.createElement("canvas")

      canvas.width = img.width
      canvas.height = img.height

      const ctx = canvas.getContext("2d")

      ctx?.drawImage(img, 0, 0)

      resolve({
        base64: canvas.toDataURL("image/jpeg", 0.85),
        width: img.width,
        height: img.height
      })
    }

    img.onerror = reject

    img.src = url
  })
