.PHONY: lint test build ci

lint:
	vendor/bin/pint --test

test:
	php artisan test --compact

build:
	docker build --check .

ci: lint test build
	@echo "ci: all targets passed"
