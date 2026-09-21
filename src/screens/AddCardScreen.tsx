import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { BackChevronIcon } from "../assets/icons/card-icons"
import { CardForm, type CardFormSubmit } from "../components/CardForm"
import { createCard } from "../data/cards"

/**
 * Full-screen add-card form. No Figma frame covers this flow — reuses the
 * close-button-top-left chrome established by the card detail screen
 * (cards-3, node 1614:1655 "top-actions") since it's the one full-screen
 * overlay pattern the design file does define.
 */
export function AddCardScreen() {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(values: CardFormSubmit) {
    setSubmitting(true)
    setError(null)
    try {
      await createCard({
        title: values.title,
        categories: values.categories,
        notes: values.notes ?? undefined,
        types: values.types,
        priceLevel: values.priceLevel ?? undefined,
        neighborhood: values.neighborhood ?? undefined,
        address: values.address ?? undefined,
        placeId: values.placeId ?? undefined,
      })
      navigate("/cards")
    } catch (err) {
      setError((err as Error).message)
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex items-center justify-between px-5 pt-2 pb-3">
        <button
          type="button"
          aria-label="Close"
          onClick={() => navigate("/cards")}
          className="flex size-[38px] items-center justify-center rounded-pill bg-surface text-ink"
        >
          <BackChevronIcon className="size-[17px]" />
        </button>
        <p className="font-display text-[15px] font-bold text-ink">add a card</p>
        <div className="size-[38px]" />
      </div>

      <div className="px-screen-x pb-8">
        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
        <CardForm
          initialValues={{
            title: "",
            categories: [],
            typesText: "",
            priceLevel: null,
            neighborhood: "",
            address: "",
            placeId: null,
            notes: "",
          }}
          submitLabel="add card"
          submitting={submitting}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  )
}
