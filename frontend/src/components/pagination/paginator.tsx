import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

interface PaginatorProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  maxVisiblePages?: number
}

export function Paginator({
  currentPage,
  totalPages,
  onPageChange,
  maxVisiblePages = 5,
}: PaginatorProps) {
  // Don't render if there are no pages or only one page
  if (totalPages <= 1) {
    return null
  }

  const handlePageClick = (page: number, event?: React.MouseEvent) => {
    event?.preventDefault()
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page)
    }
  }

  const handlePrevious = (event?: React.MouseEvent) => {
    event?.preventDefault()
    if (currentPage > 1) {
      onPageChange(currentPage - 1)
    }
  }

  const handleNext = (event?: React.MouseEvent) => {
    event?.preventDefault()
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1)
    }
  }

  // Generate page numbers to display
  const getPageNumbers = (): (number | "ellipsis")[] => {
    const pages: (number | "ellipsis")[] = []

    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Always show first page
      pages.push(1)

      // Calculate start and end of visible range around current page
      let start = Math.max(2, currentPage - Math.floor(maxVisiblePages / 2))
      let end = Math.min(totalPages - 1, start + maxVisiblePages - 3)

      // Adjust start if we're near the end
      if (end === totalPages - 1) {
        start = Math.max(2, totalPages - maxVisiblePages + 2)
        end = Math.min(totalPages - 1, start + maxVisiblePages - 3)
      }

      // Add ellipsis after first page if needed
      if (start > 2) {
        pages.push("ellipsis")
      }

      // Add visible page range
      for (let i = start; i <= end; i++) {
        pages.push(i)
      }

      // Add ellipsis before last page if needed
      if (end < totalPages - 1) {
        pages.push("ellipsis")
      }

      // Always show last page
      pages.push(totalPages)
    }

    return pages
  }

  const pageNumbers = getPageNumbers()
  const isPreviousDisabled = currentPage <= 1
  const isNextDisabled = currentPage >= totalPages

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            onClick={handlePrevious}
            className={
              isPreviousDisabled ? "pointer-events-none opacity-50" : ""
            }
            aria-disabled={isPreviousDisabled}
          />
        </PaginationItem>
        {pageNumbers.map((page, index) => {
          if (page === "ellipsis") {
            return (
              <PaginationItem key={`ellipsis-${index}`}>
                <PaginationEllipsis />
              </PaginationItem>
            )
          }
          return (
            <PaginationItem key={page}>
              <PaginationLink
                href="#"
                onClick={(e) => handlePageClick(page, e)}
                isActive={page === currentPage}
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          )
        })}
        <PaginationItem>
          <PaginationNext
            href="#"
            onClick={handleNext}
            className={isNextDisabled ? "pointer-events-none opacity-50" : ""}
            aria-disabled={isNextDisabled}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}
