import React from "react";
import "./MenuGrid.css";

const currency = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

export default function MenuGrid({ category }) {
  if (!category) return null;

  return (
    <section className="menu-grid-section">
      <header className="menu-grid-header">
        <h1>{category.label}</h1>
        <span className="menu-grid-count">{category.items.length} ítems</span>
      </header>

      <div className="menu-grid">
        {category.items.map((item) => (
          <article className="menu-card" key={item.id}>
            <div className="menu-card-top">
              <h2>{item.name}</h2>
              {item.price != null && (
                <span className="menu-card-price">{currency.format(item.price)}</span>
              )}
            </div>
            {item.prep && <p className="menu-card-prep">{item.prep}</p>}
            {item.note && <p className="menu-card-note">{item.note}</p>}
          </article>
        ))}
      </div>
    </section>
  );
}
