# Connect – Social Media Frontend (React + Vite + Tailwind)

Frontend for the live Route Posts API (`https://route-posts.routemisr.com`).

## Run
```bash
npm install
npm run dev      # http://localhost:5173
```
Optional: copy `.env.example` to `.env` to override `VITE_API_BASE_URL`.

## Endpoints used
| Feature | Request |
|---|---|
| Sign up | `POST /users/signup` (name, username, email, password, rePassword, dateOfBirth, gender) |
| Log in | `POST /users/signin` (email, password) → `data.token` saved as `localStorage.userToken` |
| Session restore | `GET /users/profile-data` |
| Change password | `PATCH /users/change-password` (password, newPassword) → rotated `data.token` is saved |
| Feed | `GET /posts?page&limit&sort=-createdAt` |
| Profile posts | `GET /users/:id/posts` (falls back to filtering `/posts`) |
| Post details | `GET /posts/:id` (falls back to scanning `/posts`) |
| Create / edit / delete post | `POST /posts`, `PUT /posts/:id` (multipart: `body`, `image`), `DELETE /posts/:id` |
| Like | `PUT /posts/:id/like` |
| Comments | `GET/POST /posts/:id/comments` (create sends multipart `content`), `PUT/DELETE /posts/:id/comments/:cid` |

Every request carries both `token: <jwt>` and `Authorization: Bearer <jwt>` via the Axios interceptor.
A 401 clears the session and redirects to Login.
