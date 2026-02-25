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
  const footerSafe = 30

  const currencySymbol = currency === "INR" ? "Rs." : "$"
  const currencyLabel = currency === "INR" ? "INR" : "USD"

  let pageNumber = 1

  //-----------------------------------
  // BORDER + FOOTER
  //-----------------------------------

  const drawBorderFooter = () => {

    doc.setDrawColor(0, 82, 156)
    doc.setLineWidth(1.2)
    doc.rect(5, 5, pageWidth - 10, pageHeight - 10)

    doc.setDrawColor(255, 102, 0)
    doc.setLineWidth(0.8)
    doc.rect(7, 7, pageWidth - 14, pageHeight - 14)

    doc.setDrawColor(0)
    doc.setLineWidth(0.3)

    doc.rect(margin + 10, pageHeight - 20, pageWidth - margin * 2 - 20, 8)

    doc.setFont("helvetica", "bold")
    doc.setFontSize(8)

    doc.text(
      "Write us: info@raiselabequip.com / sales@raiselabequip.com | Contact: +91 91777 70365",
      pageWidth / 2,
      pageHeight - 14.5,
      { align: "center" }
    )

  }

  //-----------------------------------
  // HEADER
  //-----------------------------------

  const drawHeader = (logo: string) => {

    if (logo)
      doc.addImage(logo, "JPEG", margin, 12, 70, 25)

    doc.setFont("helvetica", "bold")
    doc.setFontSize(11)
    doc.setTextColor(0, 82, 156)

    doc.text(
      "RAISE LAB EQUIPMENT",
      pageWidth - margin,
      18,
      { align: "right" }
    )

    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)
    doc.setTextColor(60)

    doc.text(
      "C-6, B1, Industrial Park, Moula Ali,\nHyderabad, Secunderabad,\nTelangana 500040",
      pageWidth - margin,
      24,
      { align: "right", lineHeightFactor: 1.4 }
    )

    doc.setDrawColor(0, 82, 156)
    doc.line(margin, 42, pageWidth - margin, 42)

    doc.setDrawColor(255, 102, 0)
    doc.line(margin, 43, pageWidth - margin, 43)
  }

  //-----------------------------------
  // PAGE NUMBER
  //-----------------------------------

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

  //-----------------------------------
  // NEW PAGE
  //-----------------------------------

  const newPage = (logo: string) => {

    doc.addPage()

    pageNumber++

    drawBorderFooter()
    drawHeader(logo)
    drawPageNumber()

    return 50
  }

  //-----------------------------------
  // LOAD LOGO
  //-----------------------------------

  let logo = ""

  try {
    logo = await getBase64ImageFromURL("/quotation-logo.jpg")
  } catch {}

  //-----------------------------------
  // LOAD IMAGES
  //-----------------------------------

  const itemImages: any = {}

  await Promise.all(
    items.map(async item => {

      if (!item.image_url) return

      try {

        const img = await getBase64ImageWithDimensions(item.image_url)

        itemImages[item.id] = img

      } catch {}

    })
  )

  //-----------------------------------
  // START FIRST PAGE
  //-----------------------------------

  drawBorderFooter()
  drawHeader(logo)
  drawPageNumber()

  let currentY = 50

  //-----------------------------------
  // TO TABLE
  //-----------------------------------

  autoTable(doc, {

    startY: currentY,

    body: [[

      {
        content:
          `To\n\n${quotation.customer_name}\n${quotation.customer_address || ""}`,
        styles: { fontStyle: "bold", fontSize: 10 }
      },

      {
        content:
          `Quote No : ${quotation.quotation_number}
Date : ${new Date().toLocaleDateString("en-GB").replace(/\//g, "-")}
Validity : ${
          validityData?.validityDate
            ? new Date(validityData.validityDate)
              .toLocaleDateString("en-GB")
              .replace(/\//g, "-")
            : ""
          }`,
        styles: { fontSize: 10, fontStyle: "bold" }
      }

    ]],

    theme: "grid",

    margin: { left: margin, right: margin }

  })

  currentY = (doc as any).lastAutoTable.finalY + 10

  //-----------------------------------
  // ITEMS LOOP
  //-----------------------------------

  for (const item of items) {

    //-----------------------------------
    // TITLE
    //-----------------------------------

    doc.setFont("helvetica", "bold")
    doc.setFontSize(14)
    doc.setTextColor(0, 82, 156)

    doc.text("Technical & Commercial Offer", pageWidth / 2, currentY, { align: "center" })

    currentY += 7

    doc.setFontSize(12)
    doc.setTextColor(0)

    doc.text(`For ${item.name}`, pageWidth / 2, currentY, { align: "center" })

    currentY += 10

    //-----------------------------------
    // DESCRIPTION
    //-----------------------------------

    doc.setFont("helvetica", "bold")
    doc.text("Description:", margin, currentY)

    currentY += 6

    doc.setFont("helvetica", "normal")

    const desc = doc.splitTextToSize(item.description || "", pageWidth - margin * 2)

    doc.text(desc, margin, currentY)

    currentY += desc.length * 5 + 5

    //-----------------------------------
    // IMAGE
    //-----------------------------------

    const image = itemImages[item.id]

    if (image) {

      const maxWidth = pageWidth - margin * 2 - 20

      const ratio = maxWidth / image.width

      const w = image.width * ratio
      const h = image.height * ratio

      const x = margin + 10

      doc.addImage(image.base64, "JPEG", x, currentY, w, h)

      currentY += h + 10
    }

    //-----------------------------------
    // FEATURES
    //-----------------------------------

    doc.setFont("helvetica", "bold")
    doc.text("FEATURES:", margin, currentY)

    currentY += 6

    doc.setFont("helvetica", "normal")

    for (const f of item.features || []) {

      const lines = doc.splitTextToSize(f, pageWidth - margin * 2 - 5)

      doc.text("•", margin, currentY)
      doc.text(lines, margin + 5, currentY)

      currentY += lines.length * 5

      if (currentY > pageHeight - footerSafe)
        currentY = newPage(logo)
    }

    //-----------------------------------
    // SPECIFICATIONS
    //-----------------------------------

    if (item.specs?.length) {

      currentY += 5

      doc.setFont("helvetica", "bold")
      doc.text("Specifications:", margin, currentY)

      currentY += 6

      doc.setFont("helvetica", "normal")

      for (const s of item.specs) {

        const text = `${s.key}: ${s.value}`

        const lines = doc.splitTextToSize(text, pageWidth - margin * 2 - 5)

        doc.text("•", margin, currentY)
        doc.text(lines, margin + 5, currentY)

        currentY += lines.length * 5

        if (currentY > pageHeight - footerSafe)
          currentY = newPage(logo)
      }
    }

    //-----------------------------------
    // COMMERCIAL TABLE
    //-----------------------------------

    currentY += 10

    doc.setFont("helvetica", "bold")
    doc.text("Commercial Offer:", margin, currentY)

    currentY += 5

    let desc = item.name

    if (item.selectedAddons?.length) {

      desc += "\n\nStandard Accessories:"

      item.selectedAddons.forEach(a =>
        desc += `\n• ${a.name}`
      )
    }

    autoTable(doc, {

      startY: currentY,

      head: [["S.No", "Description", "Qty", `Price (${currencyLabel})`]],

      body: [[
        "01",
        desc,
        "1",
        `${currencySymbol} ${item.price.toLocaleString()}/-`
      ]],

      theme: "grid",

      margin: { left: margin, right: margin }

    })

    currentY = (doc as any).lastAutoTable.finalY + 10
  }

  //-----------------------------------
  // TERMS PAGE
  //-----------------------------------

  currentY = newPage(logo)

  doc.setFont("helvetica", "bold")
  doc.setFontSize(12)
  doc.setTextColor(0, 82, 156)

  doc.text("Terms And Conditions:", margin, currentY)

  currentY += 10

  doc.setFont("helvetica", "normal")
  doc.setTextColor(0)

  for (const t of selectedTerms || []) {

    const text = `${t.title}: ${t.text}`

    const lines = doc.splitTextToSize(text, pageWidth - margin * 2 - 5)

    doc.text("•", margin, currentY)
    doc.text(lines, margin + 5, currentY)

    currentY += lines.length * 5
  }

  //-----------------------------------
  // USER SIGN
  //-----------------------------------

  currentY += 15

  doc.setFont("helvetica", "bold")

  doc.text(
    `From ${settings?.company_name || "Raise Lab Equipment"}`,
    pageWidth - margin,
    currentY,
    { align: "right" }
  )

  currentY += 6

  doc.text(
    user?.full_name || "SALES TEAM",
    pageWidth - margin,
    currentY,
    { align: "right" }
  )

  currentY += 6

  doc.setFont("helvetica", "normal")

  doc.text(
    `Contact: ${user?.phone || "+91 91777 70365"}`,
    pageWidth - margin,
    currentY,
    { align: "right" }
  )

  //-----------------------------------
  // SAVE
  //-----------------------------------

  doc.save(`${quotation.quotation_number}_Quotation.pdf`)

  return doc.output("blob")
}

////////////////////////////////////////////////////////////

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

////////////////////////////////////////////////////////////

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
