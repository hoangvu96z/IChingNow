# SpiritNow dashboard MVP

The dashboard is served from `vunph.id.vn/spiritnow/` and reads the protected
`GET /me/overview` endpoint for the signed-in user's app links and streak
summaries. The endpoint does not return readings, profile fields, or AI output.

Daily IChing content reuses `postOfTheDay()` and is labeled according to its
actual source type. Tarot reuses the existing date-seeded daily card selector
and card meanings. TuVi annual commentary remains unavailable here: the app's
existing prose interpretation is an explicit, quota-backed AI action, while
the chart summary currently exposes calculated fields such as `viewYear` and
`tieuHanCung`. Do not mark the full roadmap item complete until an approved
source for a canonical daily hexagram and annual commentary is available.
