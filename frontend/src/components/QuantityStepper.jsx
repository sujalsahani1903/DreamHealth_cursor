export default function QuantityStepper({ value, onChange, min = 1, max = 999, disabled = false }) {
  const qty = Number(value) || min;

  const dec = () => {
    if (qty > min) onChange(qty - 1);
  };

  const inc = () => {
    if (qty < max) onChange(qty + 1);
  };

  return (
    <div
      className={`inline-flex items-center overflow-hidden rounded-full border border-slate-200 bg-white dark:border-slate-600 dark:bg-slate-900 ${
        disabled ? "opacity-50" : ""
      }`}
    >
      <button
        type="button"
        disabled={disabled || qty <= min}
        onClick={dec}
        aria-label="Decrease quantity"
        className="flex h-9 w-9 items-center justify-center text-lg font-bold text-brand-green transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-slate-800"
      >
        −
      </button>
      <span className="min-w-[2.25rem] border-x border-slate-200 px-2 text-center text-sm font-bold dark:border-slate-600">
        {qty}
      </span>
      <button
        type="button"
        disabled={disabled || qty >= max}
        onClick={inc}
        aria-label="Increase quantity"
        className="flex h-9 w-9 items-center justify-center text-lg font-bold text-brand-green transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-slate-800"
      >
        +
      </button>
    </div>
  );
}
