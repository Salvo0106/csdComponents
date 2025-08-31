// Funzione per formattare le date
function formatPresetDate(date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function getOppositeTheme(theme) {
  switch (theme) {
    case "secondary":
      return "primary";
      break;

    default:
      return "secondary";
      break;
  }
}