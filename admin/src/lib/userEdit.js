/**
 * Checks the admin's edit form and builds the update. The limits match the
 * Firestore rules (isValidAdminProfileEdit), so a value the form accepts is one
 * the database accepts.
 */
export function validateUserEdit({ fullName, phone, location, points }) {
  const errors = {};
  const name = String(fullName ?? "").trim();
  const phoneText = String(phone ?? "").trim();
  const locationText = String(location ?? "").trim();
  const pointsText = String(points ?? "").trim();

  if (!name) errors.fullName = "Name is required.";
  else if (name.length > 80) errors.fullName = "Name is too long (80 characters at most).";
  if (phoneText.length > 20) errors.phone = "Phone number is too long (20 characters at most).";
  if (locationText.length > 80) errors.location = "Location is too long (80 characters at most).";

  const pointsNumber = pointsText === "" ? 0 : Number(pointsText);
  if (!Number.isInteger(pointsNumber) || pointsNumber < 0 || pointsNumber > 1000000) {
    errors.points = "Points must be a whole number from 0 to 1,000,000.";
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    data: { fullName: name, phone: phoneText, location: locationText, points: pointsNumber },
  };
}
