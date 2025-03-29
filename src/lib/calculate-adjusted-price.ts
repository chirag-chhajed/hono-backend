import { Decimal } from 'decimal.js';

type PriceCalculationArgs = {
  mode: 'absolute' | 'percentage';
  direction: 'increase' | 'decrease';
  price: number;
  value: number;
};

export function calculateAdjustedPrice({
  mode,
  direction,
  price,
  value,
}: PriceCalculationArgs): number {
  const currentPrice = new Decimal(price);
  const adjustment = new Decimal(value);

  let newPrice: Decimal;

  if (mode === 'percentage') {
    const percentageFactor = adjustment.div(100);
    newPrice = direction === 'increase'
      ? currentPrice.times(percentageFactor.plus(1))
      : currentPrice.times(new Decimal(1).minus(percentageFactor));
  }
  else {
    newPrice = direction === 'increase'
      ? currentPrice.plus(adjustment)
      : currentPrice.minus(adjustment);
  }

  return newPrice.toDecimalPlaces(2).toNumber();
}
