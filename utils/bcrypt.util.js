import bcrypt from "bcryptjs";

export function hashPassword(password) {
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(password, salt);
  return hash;
}

// export function comparePassword(password, hash) {
//   return bcrypt.compareSync(password, hash);
// }
