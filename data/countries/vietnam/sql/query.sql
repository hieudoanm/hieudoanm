--- START OF ULTIMATE TABLE ---
WITH latest AS (
	SELECT h."symbol", h."date", h."close", h."change"
	FROM vi."StockHistory" AS h
	INNER JOIN (SELECT h."symbol", MAX(h."date") AS "latest_date" FROM vi."StockHistory" AS h GROUP BY h."symbol") l
	ON h."symbol" = l."symbol" AND h."date" = l."latest_date"
	JOIN vi."StockSymbol" AS s
	ON h."symbol" = s."symbol"
	WHERE s."vn30"
	ORDER BY h."symbol"
)

SELECT h."symbol" AS symbol,
MAX(h."close") AS "all_time_highest_close",
MIN(h."close") AS "all_time_lowest_close",
l."change" AS "latest_change",
l."close" AS "latest_close",
l."date" AS "latest_date",
(l."close" - MIN(h."close")) / (MAX(h."close") - MIN(h."close")) * 100 AS "highest_percentage"
FROM vi."StockHistory" AS h
JOIN vi."StockSymbol" AS s
ON h."symbol" = s."symbol"
JOIN latest AS l
ON h."symbol" = l."symbol"
WHERE s."vn30" = true
GROUP BY h."symbol", l."change", l."close", l."date"
ORDER BY "highest_percentage" ASC;
--- END OF ULTIMATE TABLE ---
