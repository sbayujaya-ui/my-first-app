// ===== UPDATE START: WH-REFACTOR-PRODUK-002B =====

export type StatusStok = {
  label: "Habis" | "Menipis" | "Normal";
  className: string;
};

export type Margin = {
  nominal: number;
  persen: number;
};

export function getStatusStok(jumlahStok: number): StatusStok {
  if (jumlahStok <= 0) {
    return {
      label: "Habis",
      className: "bg-red-100 text-red-700",
    };
  }

  if (jumlahStok <= 5) {
    return {
      label: "Menipis",
      className: "bg-orange-100 text-orange-700",
    };
  }

  return {
    label: "Normal",
    className: "bg-green-100 text-green-700",
  };
}

export function getMargin(
  hargaBeli: number,
  hargaJual: number
): Margin {
  const nominal = hargaJual - hargaBeli;

  const persen =
    hargaBeli > 0
      ? (nominal / hargaBeli) * 100
      : 0;

  return {
    nominal,
    persen,
  };
}

// ===== UPDATE END: WH-REFACTOR-PRODUK-002B =====