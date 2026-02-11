# Rule: Keep Component Variants Under Control

Core principle: Variants change the look. Properties change the content.

## 1. Use variants for visual differences

Variants should represent properties that change how a component looks:

- Type: Primary, secondary, tertiary.
- State: Default, hover, active, disabled.
- Size: Small, medium, large.

## 2. Use properties for content differences

Properties should represent things that change what a component contains:

- Text property: Button label.
- Boolean property: Show or hide an icon.
- Instance swap: Change which icon is displayed.

## 3. Avoid unnecessary variant combinations

Example:

A button component has:

- 3 types
- 4 states
- 2 sizes
- 2 icon configurations (with or without an icon)

Without properties:

`3 × 4 × 2 × 2 = 48 variants`

By converting the icon configuration into a Boolean property:

`3 × 4 × 2 = 24 variants`

50% fewer variants

## 4. Best practices

1. Keep variants limited to visual differences.
2. Use text properties for editable labels.
3. Use Boolean properties for visibility toggles.
4. Use instance swap properties for interchangeable icons.
5. Avoid creating separate variants for content changes.
6. Make components reusable without requiring users to detach instances.

## Golden rule

> Variants change the look. Properties change the content.

Design component systems around reusable configurations, not an ever-growing collection of variants.
