extends Control

const BOARD_SIZE := 8
const TILE_SIZE := 46
const TILE_GAP := 4
const GAME_TITLE := "Bloom Tycoon"
const GAME_SUBTITLE := "Match flowers in a living garden, then grow the boutique tycoon."
const SPECIAL_NONE := 0
const SPECIAL_LINE := 1
const SPECIAL_COLOR := 2
const SPECIAL_AREA := 3
const DAILY_REWARDS := [75, 100, 125, 150, 200, 250, 350]
const SPOOKY_LUXURY_EFFECTS := {
	"candlelit_focus": {
		"name": "Candlelit Focus",
		"copy": "A ring of black candles steadies every arrangement: +2 moves for the next 3 levels.",
		"extra_moves": 2,
		"levels": 3
	},
	"midnight_velvet": {
		"name": "Midnight Velvet",
		"copy": "Velvet midnight draws higher-paying clients: +25% coins for the next 3 completed orders.",
		"coin_multiplier_percent": 125,
		"orders": 3
	}
}
const THEME := {
	"name": "Dark Elegant Floral",
	"background": Color("#120814"),
	"surface": Color("#211024"),
	"surface_2": Color("#321837"),
	"ink": Color("#fff7ea"),
	"muted": Color("#cdb8cf"),
	"accent": Color("#d8a657"),
	"accent_2": Color("#e8b6c9"),
	"emerald": Color("#4f9f79"),
	"border": Color("#5a334f"),
	"soil": Color("#2a1716"),
	"soil_alt": Color("#352019"),
	"moss": Color("#294431")
}
const FLOWERS := [
	{"name": "Sol Rot", "emoji": "☀", "color": Color("#d8a657"), "ink": Color("#2b172e"), "icon": "res://assets/tiles/48/withered_sun_medallion.png"},
	{"name": "Bone Star", "emoji": "✦", "color": Color("#e5dbc8"), "ink": Color("#2b172e"), "icon": "res://assets/tiles/48/bone_white_thorn_star.png"},
	{"name": "Nightshade", "emoji": "✹", "color": Color("#6f3aa5"), "ink": Color("#fbf0ff"), "icon": "res://assets/tiles/48/purple_nightshade_bloom.png"},
	{"name": "Bloodroot", "emoji": "♦", "color": Color("#9f2348"), "ink": Color("#fff0f5"), "icon": "res://assets/tiles/48/bloodroot_ruby_shard.png"},
	{"name": "Amber Seed", "emoji": "◆", "color": Color("#c8732a"), "ink": Color("#fff1e8"), "icon": "res://assets/tiles/48/amber_resin_seed.png"},
	{"name": "Thorn Rose", "emoji": "✧", "color": Color("#b01857"), "ink": Color("#fff0f7"), "icon": "res://assets/tiles/48/crimson_rose_rune.png"}
]
const FLOWERPEDIA_ENTRIES := [
	{"mood": "tarnished growth", "copy": "Sol Rot is an aged gold medallion whose carved rays promise reluctant, ancient growth."},
	{"mood": "celestial thorns", "copy": "Bone Star is a pale celestial seed with sharpened thorn points and graveyard elegance."},
	{"mood": "poisoned velvet", "copy": "Nightshade glows violet from a dark poisonous center, beautiful enough to distrust."},
	{"mood": "bloodroot hunger", "copy": "Bloodroot fuses thorn and ruby crystal into a thirsty old-garden relic."},
	{"mood": "amber preservation", "copy": "Amber Seed holds trapped botanical inclusions, warm, ancient, and faintly alive."},
	{"mood": "rose arcana", "copy": "Thorn Rose blooms as a magenta petal sigil, the boutique's most romantic omen."}
]
const LEVELS := [
	{"moves": 24, "targets": {0: 8, 1: 6}, "reward": 120, "name": "First Bouquet"},
	{"moves": 26, "targets": {2: 8, 3: 7}, "reward": 160, "name": "Boutique Order"},
	{"moves": 28, "targets": {0: 10, 4: 8}, "reward": 210, "name": "Wedding Sampler"}
]
const UPGRADES := [
	{"name": "Flower Cart", "cost": 80, "bonus": 4, "desc": "A charming first sales station."},
	{"name": "Bouquet Table", "cost": 180, "bonus": 8, "desc": "Faster arrangements and better orders."},
	{"name": "Display Shelf", "cost": 340, "bonus": 14, "desc": "Premium stems catch the eye."},
	{"name": "Greenhouse Corner", "cost": 620, "bonus": 24, "desc": "Fresh inventory grows while you play."},
	{"name": "Luxury Counter", "cost": 980, "bonus": 40, "desc": "The shop begins to feel like an empire."}
]
const SAVE_PATH := "user://bloom_empire_save.json"

func make_special(flower_id: int, special: int) -> int:
	return special * 100 + flower_id

func tile_flower(tile_value: int) -> int:
	if tile_value < 0:
		return tile_value
	return tile_value % 100

func tile_special(tile_value: int) -> int:
	if tile_value < 100:
		return SPECIAL_NONE
	return int(tile_value / 100)

func tiles_match(a: int, b: int) -> bool:
	return tile_flower(a) == tile_flower(b)

func special_tile_name(tile_value: int) -> String:
	var flower_id := tile_flower(tile_value)
	var flower_name: String = FLOWERS[flower_id].name
	var special := tile_special(tile_value)
	if special == SPECIAL_LINE:
		return "%s Shears" % flower_name
	if special == SPECIAL_COLOR:
		return "Golden %s" % flower_name
	if special == SPECIAL_AREA:
		return "%s Burst" % flower_name
	return flower_name

func tile_soil_color(x: int, y: int) -> Color:
	return THEME.soil if (x + y) % 2 == 0 else THEME.soil_alt

func garden_tile_tooltip(tile_value: int) -> String:
	return "%s growing in a moonlit garden bed." % special_tile_name(tile_value)

func tile_icon_path(tile_value: int) -> String:
	return str(FLOWERS[tile_flower(tile_value)].icon)

func tile_icon_texture(tile_value: int) -> Texture2D:
	var path := tile_icon_path(tile_value)
	if tile_textures.has(path):
		return tile_textures[path]
	var image := Image.new()
	var err := image.load(ProjectSettings.globalize_path(path))
	if err != OK:
		return null
	var texture := ImageTexture.create_from_image(image)
	tile_textures[path] = texture
	return texture

func tycoon_screen_title() -> String:
	return "%s — Garden Tycoon" % GAME_TITLE

var board: Array = []
var tile_buttons: Array = []
var tile_textures := {}
var selected := Vector2i(-1, -1)
var coins := 0
var passive_income := 0
var current_level := 0
var moves_left := 0
var collected := {}
var upgrades_owned := 0
var daily_streak := 0
var last_daily_claim := ""
var active_extra_moves := 0
var active_extra_move_levels_remaining := 0
var active_coin_multiplier_percent := 100
var active_coin_orders_remaining := 0
var screen := "title"

var root_box: VBoxContainer
var status_label: Label
var upgrade_progress_label: Label
var upgrade_progress_bar: ProgressBar
var objective_label: Label
var board_grid: GridContainer
var shop_panel: VBoxContainer
var message_label: Label

func _ready() -> void:
	randomize()
	load_progress()
	show_title()

func save_progress() -> void:
	var data := {
		"coins": coins,
		"passive_income": passive_income,
		"current_level": current_level,
		"upgrades_owned": upgrades_owned,
		"daily_streak": daily_streak,
		"last_daily_claim": last_daily_claim,
		"active_extra_moves": active_extra_moves,
		"active_extra_move_levels_remaining": active_extra_move_levels_remaining,
		"active_coin_multiplier_percent": active_coin_multiplier_percent,
		"active_coin_orders_remaining": active_coin_orders_remaining
	}
	var file := FileAccess.open(SAVE_PATH, FileAccess.WRITE)
	if file:
		file.store_string(JSON.stringify(data))

func load_progress() -> void:
	if not FileAccess.file_exists(SAVE_PATH):
		return
	var file := FileAccess.open(SAVE_PATH, FileAccess.READ)
	if not file:
		return
	var parsed = JSON.parse_string(file.get_as_text())
	if typeof(parsed) != TYPE_DICTIONARY:
		return
	coins = int(parsed.get("coins", coins))
	passive_income = int(parsed.get("passive_income", passive_income))
	current_level = clamp(int(parsed.get("current_level", current_level)), 0, LEVELS.size() - 1)
	upgrades_owned = clamp(int(parsed.get("upgrades_owned", upgrades_owned)), 0, UPGRADES.size())
	daily_streak = clamp(int(parsed.get("daily_streak", daily_streak)), 0, DAILY_REWARDS.size())
	last_daily_claim = str(parsed.get("last_daily_claim", last_daily_claim))
	active_extra_moves = int(parsed.get("active_extra_moves", active_extra_moves))
	active_extra_move_levels_remaining = max(0, int(parsed.get("active_extra_move_levels_remaining", active_extra_move_levels_remaining)))
	active_coin_multiplier_percent = max(100, int(parsed.get("active_coin_multiplier_percent", active_coin_multiplier_percent)))
	active_coin_orders_remaining = max(0, int(parsed.get("active_coin_orders_remaining", active_coin_orders_remaining)))

func today_key() -> String:
	var now := Time.get_datetime_dict_from_system()
	return "%04d-%02d-%02d" % [now.year, now.month, now.day]

func day_number(day_key: String) -> int:
	if day_key == "":
		return -999999
	return int(Time.get_unix_time_from_datetime_string(day_key + "T00:00:00") / 86400)

func can_claim_daily_reward(day_key: String = "") -> bool:
	var key := day_key if day_key != "" else today_key()
	return key != last_daily_claim

func daily_reward_amount(next_streak: int) -> int:
	var index = clamp(next_streak - 1, 0, DAILY_REWARDS.size() - 1)
	return DAILY_REWARDS[index]

func claim_daily_reward(day_key: String = "") -> int:
	var key := day_key if day_key != "" else today_key()
	if not can_claim_daily_reward(key):
		return 0
	var yesterday := day_number(last_daily_claim)
	var today := day_number(key)
	if today - yesterday == 1:
		daily_streak = min(daily_streak + 1, DAILY_REWARDS.size())
	else:
		daily_streak = 1
	var reward := daily_reward_amount(daily_streak)
	coins += reward
	last_daily_claim = key
	save_progress()
	return reward

func apply_spooky_luxury_effect(effect_id: String) -> bool:
	if not SPOOKY_LUXURY_EFFECTS.has(effect_id):
		return false
	var effect = SPOOKY_LUXURY_EFFECTS[effect_id]
	if effect.has("extra_moves"):
		active_extra_moves = int(effect.extra_moves)
		active_extra_move_levels_remaining = int(effect.levels)
	if effect.has("coin_multiplier_percent"):
		active_coin_multiplier_percent = int(effect.coin_multiplier_percent)
		active_coin_orders_remaining = int(effect.orders)
	save_progress()
	return true

func consume_level_start_effect() -> int:
	if active_extra_move_levels_remaining <= 0:
		active_extra_moves = 0
		return 0
	active_extra_move_levels_remaining -= 1
	var bonus := active_extra_moves
	if active_extra_move_levels_remaining <= 0:
		active_extra_moves = 0
	save_progress()
	return bonus

func calculate_order_payout(base_payout: int) -> int:
	if active_coin_orders_remaining <= 0:
		active_coin_multiplier_percent = 100
		return base_payout
	return int(round(float(base_payout * active_coin_multiplier_percent) / 100.0))

func consume_order_effect_after_win() -> void:
	if active_coin_orders_remaining <= 0:
		active_coin_multiplier_percent = 100
		return
	active_coin_orders_remaining -= 1
	if active_coin_orders_remaining <= 0:
		active_coin_multiplier_percent = 100
	save_progress()

func active_effect_summary() -> String:
	var parts := []
	if active_extra_move_levels_remaining > 0 and active_extra_moves > 0:
		parts.append("Candlelit Focus: +%d moves for %d level%s" % [active_extra_moves, active_extra_move_levels_remaining, "" if active_extra_move_levels_remaining == 1 else "s"])
	if active_coin_orders_remaining > 0 and active_coin_multiplier_percent > 100:
		parts.append("Midnight Velvet: %d%% coins for %d order%s" % [active_coin_multiplier_percent, active_coin_orders_remaining, "" if active_coin_orders_remaining == 1 else "s"])
	if parts.is_empty():
		return "No active boutique enchantments."
	return " | ".join(parts)

func activate_candlelit_focus() -> void:
	apply_spooky_luxury_effect("candlelit_focus")
	message_label.text = SPOOKY_LUXURY_EFFECTS.candlelit_focus.copy
	update_status()

func activate_midnight_velvet() -> void:
	apply_spooky_luxury_effect("midnight_velvet")
	message_label.text = SPOOKY_LUXURY_EFFECTS.midnight_velvet.copy
	update_status()

func clear_ui() -> void:
	for child in get_children():
		child.queue_free()

func make_button(text: String, cb: Callable) -> Button:
	var b := Button.new()
	b.text = text
	b.custom_minimum_size = Vector2(160, 44)
	b.pressed.connect(cb)
	style_button(b)
	return b

func make_card_style(fill: Color, border: Color = THEME.border, radius: int = 18) -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = fill
	style.border_color = border
	style.border_width_left = 1
	style.border_width_right = 1
	style.border_width_top = 1
	style.border_width_bottom = 1
	style.corner_radius_top_left = radius
	style.corner_radius_top_right = radius
	style.corner_radius_bottom_left = radius
	style.corner_radius_bottom_right = radius
	style.shadow_color = Color("#000000", 0.28)
	style.shadow_size = 10
	style.content_margin_left = 12
	style.content_margin_right = 12
	style.content_margin_top = 10
	style.content_margin_bottom = 10
	return style

func style_label(label: Label, size: int = 16, color: Color = THEME.ink) -> void:
	label.add_theme_color_override("font_color", color)
	label.add_theme_font_size_override("font_size", size)
	label.add_theme_color_override("font_shadow_color", Color("#000000", 0.4))
	label.add_theme_constant_override("shadow_offset_x", 0)
	label.add_theme_constant_override("shadow_offset_y", 2)

func style_button(button: Button) -> void:
	button.add_theme_color_override("font_color", THEME.ink)
	button.add_theme_color_override("font_hover_color", Color("#ffffff"))
	button.add_theme_color_override("font_pressed_color", Color("#2b172e"))
	button.add_theme_stylebox_override("normal", make_card_style(THEME.surface_2, THEME.border, 14))
	button.add_theme_stylebox_override("hover", make_card_style(Color("#45204b"), THEME.accent_2, 14))
	button.add_theme_stylebox_override("pressed", make_card_style(THEME.accent, THEME.accent, 14))
	button.add_theme_stylebox_override("disabled", make_card_style(Color("#211522"), Color("#3b2638"), 14))

func build_shell(title: String) -> void:
	clear_ui()
	var background := ColorRect.new()
	background.color = THEME.background
	background.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(background)

	root_box = VBoxContainer.new()
	root_box.set_anchors_preset(Control.PRESET_FULL_RECT)
	root_box.add_theme_constant_override("separation", 10)
	root_box.add_theme_constant_override("margin_left", 18)
	root_box.add_theme_constant_override("margin_right", 18)
	root_box.add_theme_constant_override("margin_top", 18)
	root_box.add_theme_constant_override("margin_bottom", 18)
	add_child(root_box)

	var header := Label.new()
	header.text = title
	header.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	style_label(header, 30, THEME.accent)
	root_box.add_child(header)

	status_label = Label.new()
	status_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	style_label(status_label, 14, THEME.muted)
	root_box.add_child(status_label)

	upgrade_progress_label = Label.new()
	upgrade_progress_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	upgrade_progress_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	style_label(upgrade_progress_label, 13, THEME.accent_2)
	root_box.add_child(upgrade_progress_label)

	upgrade_progress_bar = ProgressBar.new()
	upgrade_progress_bar.custom_minimum_size = Vector2(360, 12)
	upgrade_progress_bar.max_value = 100
	upgrade_progress_bar.show_percentage = false
	upgrade_progress_bar.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	upgrade_progress_bar.add_theme_stylebox_override("background", make_card_style(Color("#1a0c1d"), THEME.border, 8))
	upgrade_progress_bar.add_theme_stylebox_override("fill", make_card_style(THEME.accent, THEME.accent, 8))
	root_box.add_child(upgrade_progress_bar)

	message_label = Label.new()
	message_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	message_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	style_label(message_label, 16, THEME.ink)
	root_box.add_child(message_label)
	update_status()

func update_status() -> void:
	if status_label:
		status_label.text = "Coins: %d   |   Passive: +%d/order   |   Shop tier: %d/%d\n%s" % [coins, passive_income, upgrades_owned, UPGRADES.size(), active_effect_summary()]
	if upgrade_progress_label:
		upgrade_progress_label.text = next_upgrade_helper_text()
	if upgrade_progress_bar:
		upgrade_progress_bar.value = next_upgrade_progress().percent

func next_upgrade_progress() -> Dictionary:
	if upgrades_owned >= UPGRADES.size():
		return {"owned_all": true, "cost": 0, "remaining": 0, "percent": 100, "name": "Complete"}
	var upgrade = UPGRADES[upgrades_owned]
	var cost: int = upgrade.cost
	var remaining: int = max(0, cost - coins)
	var percent: int = clamp(int(float(coins) / float(cost) * 100.0), 0, 100)
	return {"owned_all": false, "cost": cost, "remaining": remaining, "percent": percent, "name": upgrade.name}

func next_upgrade_helper_text() -> String:
	var progress := next_upgrade_progress()
	if progress.owned_all:
		return "All boutique upgrades acquired. Your floral empire is fully appointed."
	if progress.remaining <= 0:
		return "Next: %s — ready to buy (%d/%d coins)." % [progress.name, coins, progress.cost]
	return "Next: %s — %d coins to go (%d/%d)." % [progress.name, progress.remaining, coins, progress.cost]

func objectives_remaining_text() -> String:
	var level = LEVELS[current_level]
	var remaining_parts := []
	for key in level.targets.keys():
		var remaining: int = max(0, level.targets[key] - collected.get(key, 0))
		if remaining > 0:
			remaining_parts.append("%d %s" % [remaining, FLOWERS[key].name])
	if remaining_parts.is_empty():
		return "no elements"
	return ", ".join(remaining_parts)

func level_result_copy(won: bool, payout: int = 0) -> String:
	if won:
		return "Order complete. Earned %d coins. The boutique grows more resplendent." % payout
	return "So close — %s remaining. Try again and finish the bouquet." % objectives_remaining_text()

func reward_chest_summary(payout: int) -> Dictionary:
	return {
		"name": "Velvet Bloom Chest",
		"coins": payout,
		"copy": "Velvet Bloom Chest opened: +%d coins, wrapped in midnight petals." % payout
	}

func upgrade_result_copy(index: int) -> String:
	var safe_index: int = clamp(index, 0, UPGRADES.size() - 1)
	var upgrade: Dictionary = UPGRADES[safe_index]
	return "%s installed — +%d passive coins per order. %s" % [upgrade.name, upgrade.bonus, upgrade.desc]

func flowerpedia_entry_text(flower_id: int) -> String:
	var safe_id: int = clamp(flower_id, 0, FLOWERS.size() - 1)
	var flower: Dictionary = FLOWERS[safe_id]
	var entry: Dictionary = FLOWERPEDIA_ENTRIES[safe_id]
	return "%s %s — %s mood; symbol color %s. %s" % [flower.emoji, flower.name, entry.mood, flower.color.to_html(false), entry.copy]

func show_title() -> void:
	screen = "title"
	build_shell(GAME_TITLE)
	message_label.text = GAME_SUBTITLE
	var spacer := Control.new()
	spacer.custom_minimum_size = Vector2(1, 80)
	root_box.add_child(spacer)
	if can_claim_daily_reward():
		root_box.add_child(make_button("Claim Daily Bloom", Callable(self, "claim_daily_from_title")))
	root_box.add_child(make_button("Light Candlelit Focus", Callable(self, "activate_candlelit_focus")))
	root_box.add_child(make_button("Drape Midnight Velvet", Callable(self, "activate_midnight_velvet")))
	root_box.add_child(make_button("Play Garden Match", Callable(self, "start_game")))
	root_box.add_child(make_button("Garden Tycoon", Callable(self, "show_tycoon")))
	root_box.add_child(make_button("Flowerpedia", Callable(self, "show_flowerpedia")))

func show_flowerpedia() -> void:
	screen = "flowerpedia"
	build_shell("%s — Flowerpedia" % GAME_TITLE)
	message_label.text = "A living collection album foundation for flower lore, tile readability, and future unlocks."
	for i in range(FLOWERS.size()):
		var card := PanelContainer.new()
		card.add_theme_stylebox_override("panel", make_card_style(THEME.surface, THEME.border, 16))
		var label := Label.new()
		label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		label.text = flowerpedia_entry_text(i)
		style_label(label, 14, THEME.ink)
		card.add_child(label)
		root_box.add_child(card)
	var controls := HBoxContainer.new()
	controls.alignment = BoxContainer.ALIGNMENT_CENTER
	controls.add_child(make_button("Play", Callable(self, "start_game")))
	controls.add_child(make_button("Title", Callable(self, "show_title")))
	root_box.add_child(controls)

func claim_daily_from_title() -> void:
	var reward := claim_daily_reward()
	message_label.text = "Daily Bloom claimed: +%d coins. Streak: %d day%s." % [reward, daily_streak, "" if daily_streak == 1 else "s"]
	update_status()

func start_game() -> void:
	current_level = clamp(current_level, 0, LEVELS.size() - 1)
	var level = LEVELS[current_level]
	moves_left = level.moves + consume_level_start_effect()
	collected = {}
	for key in level.targets.keys():
		collected[key] = 0
	build_board_without_matches()
	show_match_screen()

func show_match_screen() -> void:
	screen = "match"
	build_shell("%s — Garden Match" % GAME_TITLE)
	objective_label = Label.new()
	objective_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	objective_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	style_label(objective_label, 15, THEME.accent_2)
	root_box.add_child(objective_label)

	board_grid = GridContainer.new()
	board_grid.columns = BOARD_SIZE
	board_grid.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	root_box.add_child(board_grid)

	tile_buttons = []
	for y in range(BOARD_SIZE):
		var row := []
		for x in range(BOARD_SIZE):
			var btn := Button.new()
			btn.custom_minimum_size = Vector2(TILE_SIZE, TILE_SIZE)
			btn.pressed.connect(Callable(self, "on_tile_pressed").bind(x, y))
			board_grid.add_child(btn)
			row.append(btn)
		tile_buttons.append(row)

	var controls := HBoxContainer.new()
	controls.alignment = BoxContainer.ALIGNMENT_CENTER
	controls.add_child(make_button("Shuffle", Callable(self, "shuffle_board")))
	controls.add_child(make_button("Tycoon", Callable(self, "show_tycoon")))
	root_box.add_child(controls)
	refresh_board()
	update_objective()

func build_board_without_matches() -> void:
	board = []
	for y in range(BOARD_SIZE):
		var row := []
		for x in range(BOARD_SIZE):
			row.append(randi() % FLOWERS.size())
		board.append(row)
	while find_matches().size() > 0:
		for match_cells in find_matches():
			for cell in match_cells:
				board[cell.y][cell.x] = randi() % FLOWERS.size()

func refresh_board() -> void:
	for y in range(BOARD_SIZE):
		for x in range(BOARD_SIZE):
			var flower_id: int = tile_flower(board[y][x])
			var btn: Button = tile_buttons[y][x]
			btn.text = "" if tile_icon_texture(board[y][x]) else tile_display_text(board[y][x])
			btn.icon = tile_icon_texture(board[y][x])
			btn.tooltip_text = garden_tile_tooltip(board[y][x])
			btn.add_theme_color_override("font_color", FLOWERS[flower_id].color.lightened(0.28))
			btn.add_theme_font_size_override("font_size", 24)
			var style := StyleBoxFlat.new()
			style.bg_color = tile_soil_color(x, y)
			style.border_width_left = 1
			style.border_width_right = 1
			style.border_width_top = 1
			style.border_width_bottom = 1
			style.border_color = THEME.moss
			style.corner_radius_top_left = 10
			style.corner_radius_top_right = 10
			style.corner_radius_bottom_left = 10
			style.corner_radius_bottom_right = 10
			if tile_special(board[y][x]) != SPECIAL_NONE:
				style.border_width_left = 3
				style.border_width_right = 3
				style.border_width_top = 3
				style.border_width_bottom = 3
				style.border_color = THEME.accent
			if selected == Vector2i(x, y):
				style.border_width_left = 4
				style.border_width_right = 4
				style.border_width_top = 4
				style.border_width_bottom = 4
				style.border_color = Color("#17111f")
			btn.add_theme_stylebox_override("normal", style)
			btn.add_theme_stylebox_override("pressed", style)
			btn.add_theme_stylebox_override("hover", style)
	update_status()

func tile_display_text(tile_value: int) -> String:
	var flower_id := tile_flower(tile_value)
	var special := tile_special(tile_value)
	if special == SPECIAL_LINE:
		return FLOWERS[flower_id].emoji + "✂"
	if special == SPECIAL_COLOR:
		return FLOWERS[flower_id].emoji + "★"
	if special == SPECIAL_AREA:
		return FLOWERS[flower_id].emoji + "✥"
	return FLOWERS[flower_id].emoji

func update_objective() -> void:
	var level = LEVELS[current_level]
	var parts := []
	for key in level.targets.keys():
		parts.append("%s %d/%d" % [FLOWERS[key].name, collected.get(key, 0), level.targets[key]])
	objective_label.text = "%s | Moves: %d | Order: %s" % [level.name, moves_left, ", ".join(parts)]

func on_tile_pressed(x: int, y: int) -> void:
	if moves_left <= 0:
		return
	var pos := Vector2i(x, y)
	if selected == Vector2i(-1, -1):
		selected = pos
		refresh_board()
		return
	if selected == pos:
		selected = Vector2i(-1, -1)
		refresh_board()
		return
	if abs(selected.x - x) + abs(selected.y - y) != 1:
		selected = pos
		refresh_board()
		return
	var special_clear := special_swap_clear_cells(selected, pos)
	swap_tiles(selected, pos)
	var matches := find_matches()
	if not special_clear.is_empty():
		var special_message := special_swap_summary(selected, pos, special_clear.size())
		moves_left -= 1
		clear_specific_cells(special_clear)
		collapse_columns()
		var chain := find_matches()
		while not chain.is_empty():
			clear_matches(chain, false)
			collapse_columns()
			chain = find_matches()
		message_label.text = special_message
	elif matches.is_empty():
		swap_tiles(selected, pos)
		message_label.text = "No bouquet match there. Try another adjacent swap."
	else:
		moves_left -= 1
		resolve_matches(matches)
		message_label.text = "A fine arrangement."
	selected = Vector2i(-1, -1)
	refresh_board()
	update_objective()
	check_level_state()

func swap_tiles(a: Vector2i, b: Vector2i) -> void:
	var tmp = board[a.y][a.x]
	board[a.y][a.x] = board[b.y][b.x]
	board[b.y][b.x] = tmp

func find_matches() -> Array:
	var matches := []
	for y in range(BOARD_SIZE):
		var start := 0
		for x in range(1, BOARD_SIZE + 1):
			if x == BOARD_SIZE or not tiles_match(board[y][x], board[y][start]):
				if x - start >= 3:
					var cells := []
					for mx in range(start, x):
						cells.append(Vector2i(mx, y))
					matches.append(cells)
				start = x
	for x in range(BOARD_SIZE):
		var start := 0
		for y in range(1, BOARD_SIZE + 1):
			if y == BOARD_SIZE or not tiles_match(board[y][x], board[start][x]):
				if y - start >= 3:
					var cells := []
					for my in range(start, y):
						cells.append(Vector2i(x, my))
					matches.append(cells)
				start = y
	return matches

func resolve_matches(matches: Array) -> void:
	clear_matches(matches, true)
	collapse_columns()
	var chain := find_matches()
	while not chain.is_empty():
		clear_matches(chain, false)
		collapse_columns()
		chain = find_matches()

func clear_matches(matches: Array, create_specials: bool) -> void:
	var cleared := {}
	var preserved := {}
	var area_special_cell := find_overlapping_match_cell(matches) if create_specials else Vector2i(-1, -1)
	if area_special_cell != Vector2i(-1, -1):
		var area_flower_id := tile_flower(board[area_special_cell.y][area_special_cell.x])
		board[area_special_cell.y][area_special_cell.x] = make_special(area_flower_id, SPECIAL_AREA)
		preserved[area_special_cell] = true
	for match_cells in matches:
		if create_specials and area_special_cell == Vector2i(-1, -1) and match_cells.size() >= 4:
			var special_cell: Vector2i = match_cells[0]
			var flower_id := tile_flower(board[special_cell.y][special_cell.x])
			var special_type := SPECIAL_COLOR if match_cells.size() >= 5 else SPECIAL_LINE
			board[special_cell.y][special_cell.x] = make_special(flower_id, special_type)
			preserved[special_cell] = true
		for cell in match_cells:
			if not preserved.has(cell):
				cleared[cell] = true
	cleared = expand_special_clears(cleared)
	clear_specific_cells(cleared)

func find_overlapping_match_cell(matches: Array) -> Vector2i:
	var seen := {}
	for match_cells in matches:
		for cell in match_cells:
			if seen.has(cell):
				return cell
			seen[cell] = true
	return Vector2i(-1, -1)

func clear_specific_cells(cells: Dictionary) -> void:
	for cell in cells.keys():
		var flower_id: int = tile_flower(board[cell.y][cell.x])
		if collected.has(flower_id):
			collected[flower_id] += 1
		board[cell.y][cell.x] = -1

func special_swap_clear_cells(a: Vector2i, b: Vector2i) -> Dictionary:
	var cleared := {}
	var a_special := tile_special(board[a.y][a.x])
	var b_special := tile_special(board[b.y][b.x])
	if a_special == SPECIAL_COLOR and b_special == SPECIAL_COLOR:
		add_full_board_clear(cleared)
		return cleared
	if is_line_area_combo(a_special, b_special):
		add_shears_burst_cells(cleared, a, b)
		return cleared
	add_special_swap_clears(cleared, a, b)
	add_special_swap_clears(cleared, b, a)
	return cleared

func add_full_board_clear(cleared: Dictionary) -> void:
	for y in range(BOARD_SIZE):
		for x in range(BOARD_SIZE):
			cleared[Vector2i(x, y)] = true

func is_line_area_combo(a_special: int, b_special: int) -> bool:
	return (a_special == SPECIAL_LINE and b_special == SPECIAL_AREA) or (a_special == SPECIAL_AREA and b_special == SPECIAL_LINE)

func add_shears_burst_cells(cleared: Dictionary, a: Vector2i, b: Vector2i) -> void:
	var center := a if tile_special(board[a.y][a.x]) == SPECIAL_AREA else b
	for y in range(max(0, center.y - 1), min(BOARD_SIZE, center.y + 2)):
		for x in range(BOARD_SIZE):
			cleared[Vector2i(x, y)] = true
	for x in range(max(0, center.x - 1), min(BOARD_SIZE, center.x + 2)):
		for y in range(BOARD_SIZE):
			cleared[Vector2i(x, y)] = true

func special_swap_summary(a: Vector2i, b: Vector2i, cleared_count: int) -> String:
	var a_special := tile_special(board[a.y][a.x])
	var b_special := tile_special(board[b.y][b.x])
	if is_supreme_bloom_clear(cleared_count):
		return "SUPREME BLOOM! +%d rare order value — %d tiles erupted." % [supreme_bloom_reward_bonus(cleared_count), cleared_count]
	if a_special == SPECIAL_COLOR and b_special == SPECIAL_COLOR:
		return "Golden bouquet combo: the entire board blooms at once — %d tiles swept away." % cleared_count
	if is_line_area_combo(a_special, b_special):
		return "Shears Burst combo: three rows and columns bloom outward — %d tiles swept away." % cleared_count
	if a_special != SPECIAL_NONE and b_special != SPECIAL_NONE:
		return "Special bouquet combo released: %d tiles swept away." % cleared_count
	return "Special bloom released: %d tiles swept away." % cleared_count

func is_supreme_bloom_clear(cleared_count: int) -> bool:
	return cleared_count >= BOARD_SIZE * BOARD_SIZE

func supreme_bloom_reward_bonus(cleared_count: int) -> int:
	if not is_supreme_bloom_clear(cleared_count):
		return 0
	return 12

func add_special_swap_clears(cleared: Dictionary, special_cell: Vector2i, other_cell: Vector2i) -> void:
	var tile_value: int = board[special_cell.y][special_cell.x]
	var special := tile_special(tile_value)
	if special == SPECIAL_LINE:
		for x in range(BOARD_SIZE):
			cleared[Vector2i(x, special_cell.y)] = true
		for y in range(BOARD_SIZE):
			cleared[Vector2i(special_cell.x, y)] = true
	elif special == SPECIAL_AREA:
		add_area_burst_cells(cleared, special_cell)
	elif special == SPECIAL_COLOR:
		var flower_id := tile_flower(tile_value)
		if tile_special(board[other_cell.y][other_cell.x]) == SPECIAL_NONE:
			flower_id = tile_flower(board[other_cell.y][other_cell.x])
		for y in range(BOARD_SIZE):
			for x in range(BOARD_SIZE):
				if tile_flower(board[y][x]) == flower_id:
					cleared[Vector2i(x, y)] = true

func expand_special_clears(cleared: Dictionary) -> Dictionary:
	var expanded := cleared.duplicate()
	for cell in cleared.keys():
		var tile_value: int = board[cell.y][cell.x]
		var special := tile_special(tile_value)
		if special == SPECIAL_LINE:
			for x in range(BOARD_SIZE):
				expanded[Vector2i(x, cell.y)] = true
			for y in range(BOARD_SIZE):
				expanded[Vector2i(cell.x, y)] = true
		elif special == SPECIAL_AREA:
			add_area_burst_cells(expanded, cell)
		elif special == SPECIAL_COLOR:
			var flower_id := tile_flower(tile_value)
			for y in range(BOARD_SIZE):
				for x in range(BOARD_SIZE):
					if tile_flower(board[y][x]) == flower_id:
						expanded[Vector2i(x, y)] = true
	return expanded

func add_area_burst_cells(cleared: Dictionary, center: Vector2i) -> void:
	for y in range(max(0, center.y - 1), min(BOARD_SIZE, center.y + 2)):
		for x in range(max(0, center.x - 1), min(BOARD_SIZE, center.x + 2)):
			cleared[Vector2i(x, y)] = true

func collapse_columns() -> void:
	for x in range(BOARD_SIZE):
		var stack := []
		for y in range(BOARD_SIZE - 1, -1, -1):
			if board[y][x] != -1:
				stack.append(board[y][x])
		for y in range(BOARD_SIZE - 1, -1, -1):
			if stack.size() > 0:
				board[y][x] = stack.pop_front()
			else:
				board[y][x] = randi() % FLOWERS.size()

func check_level_state() -> void:
	var level = LEVELS[current_level]
	var complete := true
	for key in level.targets.keys():
		if collected.get(key, 0) < level.targets[key]:
			complete = false
	if complete:
		var payout: int = calculate_order_payout(level.reward + passive_income)
		coins += payout
		message_label.text = level_result_copy(true, payout)
		current_level = (current_level + 1) % LEVELS.size()
		consume_order_effect_after_win()
		save_progress()
		update_status()
		show_result_modal(true, payout)
	elif moves_left <= 0:
		message_label.text = level_result_copy(false)
		show_result_modal(false, 0)

func show_result_modal(won: bool, payout: int = 0) -> void:
	var overlay := PanelContainer.new()
	overlay.name = "LevelResultModal"
	overlay.set_anchors_preset(Control.PRESET_CENTER)
	overlay.custom_minimum_size = Vector2(430, 230)
	overlay.add_theme_stylebox_override("panel", make_card_style(Color("#211024"), THEME.accent if won else THEME.accent_2, 22))
	root_box.add_child(overlay)

	var modal_box := VBoxContainer.new()
	modal_box.add_theme_constant_override("separation", 10)
	overlay.add_child(modal_box)

	var title := Label.new()
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.text = "Bouquet Delivered" if won else "So Close"
	style_label(title, 24, THEME.accent if won else THEME.accent_2)
	modal_box.add_child(title)

	var body := Label.new()
	body.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	body.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	body.text = level_result_copy(won, payout)
	if won:
		var chest := reward_chest_summary(payout)
		body.text += "\n" + chest.copy
	style_label(body, 16, THEME.ink)
	modal_box.add_child(body)

	var controls := HBoxContainer.new()
	controls.alignment = BoxContainer.ALIGNMENT_CENTER
	if won:
		controls.add_child(make_button("Continue to Tycoon", Callable(self, "show_tycoon")))
	else:
		controls.add_child(make_button("Try Again", Callable(self, "start_game")))
		controls.add_child(make_button("Tycoon", Callable(self, "show_tycoon")))
	modal_box.add_child(controls)

func shuffle_board() -> void:
	moves_left = max(0, moves_left - 1)
	build_board_without_matches()
	selected = Vector2i(-1, -1)
	refresh_board()
	update_objective()
	check_level_state()

func show_shop() -> void:
	show_tycoon()

func show_tycoon() -> void:
	screen = "tycoon"
	build_shell(tycoon_screen_title())
	message_label.text = shop_description()
	shop_panel = VBoxContainer.new()
	shop_panel.add_theme_constant_override("separation", 8)
	root_box.add_child(shop_panel)
	for i in range(UPGRADES.size()):
		var upgrade = UPGRADES[i]
		var line := HBoxContainer.new()
		var owned := i < upgrades_owned
		var label := Label.new()
		label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		label.text = "%s — %s%s" % [upgrade.name, "OWNED" if owned else str(upgrade.cost) + " coins", " | +%d" % upgrade.bonus]
		style_label(label, 14, THEME.ink if not owned else THEME.emerald)
		line.add_child(label)
		var btn := Button.new()
		btn.text = "Buy" if not owned else "✓"
		btn.disabled = owned or coins < upgrade.cost or i > upgrades_owned
		btn.pressed.connect(Callable(self, "buy_upgrade").bind(i))
		style_button(btn)
		line.add_child(btn)
		shop_panel.add_child(line)
	var controls := HBoxContainer.new()
	controls.alignment = BoxContainer.ALIGNMENT_CENTER
	controls.add_child(make_button("Play Next Order", Callable(self, "start_game")))
	controls.add_child(make_button("Title", Callable(self, "show_title")))
	root_box.add_child(controls)

func shop_description() -> String:
	var tier_names := ["a humble cart", "a bright bouquet table", "a styled display shelf", "a living greenhouse corner", "a luxury floral counter", "a polished floral empire"]
	return "Your shop is %s. Complete orders to earn coins and unlock the next flourish." % tier_names[upgrades_owned]

func buy_upgrade(index: int) -> void:
	if index != upgrades_owned:
		message_label.text = "Build the empire in order, one graceful step at a time."
		return
	var upgrade = UPGRADES[index]
	if coins < upgrade.cost:
		message_label.text = "Not enough coins yet. One more order may do it."
		return
	coins -= upgrade.cost
	upgrades_owned += 1
	passive_income += upgrade.bonus
	save_progress()
	show_shop()
	show_upgrade_modal(index)

func show_upgrade_modal(index: int) -> void:
	var overlay := PanelContainer.new()
	overlay.name = "UpgradeRevealModal"
	overlay.set_anchors_preset(Control.PRESET_CENTER)
	overlay.custom_minimum_size = Vector2(430, 210)
	overlay.add_theme_stylebox_override("panel", make_card_style(Color("#211024"), THEME.emerald, 22))
	root_box.add_child(overlay)

	var modal_box := VBoxContainer.new()
	modal_box.add_theme_constant_override("separation", 10)
	overlay.add_child(modal_box)

	var title := Label.new()
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.text = "Boutique Upgraded"
	style_label(title, 24, THEME.emerald)
	modal_box.add_child(title)

	var body := Label.new()
	body.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	body.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	body.text = upgrade_result_copy(index) + "\nNext helper updated: " + next_upgrade_helper_text()
	style_label(body, 16, THEME.ink)
	modal_box.add_child(body)

	var controls := HBoxContainer.new()
	controls.alignment = BoxContainer.ALIGNMENT_CENTER
	controls.add_child(make_button("Play Next Order", Callable(self, "start_game")))
	controls.add_child(make_button("Keep Shopping", Callable(self, "show_shop")))
	modal_box.add_child(controls)
