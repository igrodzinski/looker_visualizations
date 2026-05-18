const raport = String(getValue('Raport nazwa') || '').trim();
const kod = String(getValue('Kod Pozycji') || '').trim();
const raportLower = raport.toLowerCase();

if (raport === 'Rachunek zysków i strat') {
  return kod === '1.3' || kod === '1.3.1.1.1';
} else if (raportLower === 'aktywa' || raportLower === 'pasywa') {
  return /^[^.]+$/.test(kod);
}

return false;
