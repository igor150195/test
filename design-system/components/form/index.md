# Form controls

Независимые form-компоненты не используют Shop2, Remodal, `gr-*`,
`.js-selected` и не требуют legacy-структуру `ul > li`. Подключите `core.css`
до `components.css`, чтобы были доступны tokens и общие a11y-правила.

## Текстовое поле, textarea и select

Связывайте видимую подпись с контролом через `for` и `id`:

```html
<div class="ds-field">
    <label for="email">Электронная почта</label>
    <input class="ds-input" id="email" name="email" type="email" autocomplete="email">
</div>

<div class="ds-field">
    <label for="message">Сообщение</label>
    <textarea class="ds-textarea" id="message" name="message"></textarea>
</div>

<div class="ds-field">
    <label for="country">Страна</label>
    <select class="ds-select" id="country" name="country">
        <option value="">Выберите страну</option>
    </select>
</div>
```

Поддерживаемые текстовые selectors: `input.ds-input[type="text"]`,
`input.ds-input[type="email"]`, `textarea.ds-textarea` и `select.ds-select`.
Размер по умолчанию — `md`; можно добавить один из модификаторов `--sm` или
`--lg` к соответствующему классу.

Ошибка задаётся `aria-invalid="true"` или модификатором `--error`. Для
доступного сообщения свяжите описание с полем через `aria-describedby`:

```html
<label for="name">Имя</label>
<input
    class="ds-input"
    id="name"
    name="name"
    type="text"
    aria-invalid="true"
    aria-describedby="name-error"
>
<p id="name-error">Укажите имя.</p>
```

Нативный `disabled` поддерживается. `:focus-visible` доступен только для
клавиатурной навигации.

`.ds-field` — необязательная семантическая обёртка; в этот этап она не имеет
собственных стилей и не является обязательной для работы контролов.

## Checkbox

`input` должен находиться перед `.ds-checkbox__control`, чтобы состояния
нативного контрола корректно передавались индикатору. Обёртка `label` делает
кликабельной и подпись, и сам индикатор:

```html
<label class="ds-checkbox ds-checkbox--md">
    <input class="ds-checkbox__input" name="terms" type="checkbox">
    <span class="ds-checkbox__control" aria-hidden="true"></span>
    <span class="ds-checkbox__label">Я принимаю условия</span>
</label>
```

Поддерживаются `--sm`, `--md` (базовый размер) и `--lg`, `disabled`,
`aria-invalid="true"` на input и модификатор `.ds-checkbox--error`.

## Radio

Используйте одинаковое `name` для взаимно исключающейся группы:

```html
<label class="ds-radio">
    <input class="ds-radio__input" name="delivery" type="radio" value="courier">
    <span class="ds-radio__control" aria-hidden="true"></span>
    <span class="ds-radio__label">Курьером</span>
</label>
```

Поддерживаются `--sm`, `--md` (базовый размер) и `--lg`, `disabled`,
`aria-invalid="true"` на input и модификатор `.ds-radio--error`.

Не скрывайте native input через `display: none` или `visibility: hidden`: класс
`__input` визуально скрывает его, но сохраняет фокус и семантику для клавиатуры
и скринридера.
