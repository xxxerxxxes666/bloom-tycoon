extends SceneTree

func _init() -> void:
	var MainScript = load("res://src/Main.gd")
	var main = MainScript.new()
	root.add_child(main)
	await process_frame

	assert(main.BOARD_SIZE == 8)
	assert(main.GAME_TITLE == "Bloom Tycoon")
	assert(main.GAME_SUBTITLE.find("garden") >= 0)
	assert(main.tycoon_screen_title() == "Bloom Tycoon — Garden Tycoon")
	assert(main.tile_soil_color(0, 0) != main.tile_soil_color(1, 0))
	assert(main.garden_tile_tooltip(0).find("garden bed") >= 0)
	assert(main.FLOWERS.size() == 6)
	assert(main.FLOWERS[0].name == "Sol Rot")
	assert(main.FLOWERS[0].icon.find("withered_sun_medallion") >= 0)
	assert(main.FLOWERS[5].name == "Thorn Rose")
	assert(main.tile_icon_path(2).find("purple_nightshade_bloom") >= 0)
	assert(main.UPGRADES.size() == 5)
	assert(main.THEME.name == "Dark Elegant Floral")
	assert(main.THEME.background == Color("#120814"))
	assert(main.THEME.accent == Color("#d8a657"))
	assert(main.make_special(2, main.SPECIAL_LINE) == 102)
	assert(main.make_special(4, main.SPECIAL_COLOR) == 204)
	assert(main.make_special(3, main.SPECIAL_AREA) == 303)
	assert(main.tile_flower(204) == 4)
	assert(main.tile_special(204) == main.SPECIAL_COLOR)
	assert(main.tiles_match(104, 4))
	assert(main.special_tile_name(main.make_special(0, main.SPECIAL_LINE)) == "Sol Rot Shears")
	assert(main.special_tile_name(main.make_special(2, main.SPECIAL_COLOR)) == "Golden Nightshade")
	assert(main.special_tile_name(main.make_special(3, main.SPECIAL_AREA)) == "Bloodroot Burst")
	assert(main.tile_display_text(main.make_special(0, main.SPECIAL_LINE)) == "☀✂")
	assert(main.tile_display_text(main.make_special(2, main.SPECIAL_COLOR)) == "✹★")
	assert(main.tile_display_text(main.make_special(3, main.SPECIAL_AREA)) == "♦✥")
	main.board = []
	for y in range(main.BOARD_SIZE):
		var row := []
		for x in range(main.BOARD_SIZE):
			row.append((x + y) % main.FLOWERS.size())
		main.board.append(row)
	main.board[3][4] = main.make_special(0, main.SPECIAL_LINE)
	var line_clear = main.special_swap_clear_cells(Vector2i(4, 3), Vector2i(4, 4))
	assert(line_clear.size() == 15)
	assert(line_clear.has(Vector2i(0, 3)))
	assert(line_clear.has(Vector2i(4, 0)))
	main.board[4][4] = main.make_special(3, main.SPECIAL_AREA)
	var line_area_combo = main.special_swap_clear_cells(Vector2i(4, 3), Vector2i(4, 4))
	assert(line_area_combo.size() == 39)
	assert(line_area_combo.has(Vector2i(0, 3)))
	assert(line_area_combo.has(Vector2i(7, 5)))
	assert(line_area_combo.has(Vector2i(3, 0)))
	assert(line_area_combo.has(Vector2i(5, 7)))
	assert(main.special_swap_summary(Vector2i(4, 3), Vector2i(4, 4), line_area_combo.size()).find("Shears Burst") >= 0)
	main.board[3][4] = 0
	var area_clear = main.special_swap_clear_cells(Vector2i(4, 4), Vector2i(4, 5))
	assert(area_clear.size() == 9)
	assert(area_clear.has(Vector2i(3, 3)))
	assert(area_clear.has(Vector2i(5, 5)))
	main.board[1][1] = main.make_special(2, main.SPECIAL_COLOR)
	main.board[2][1] = 2
	main.board[0][0] = 2
	main.board[7][7] = 2
	var color_clear = main.special_swap_clear_cells(Vector2i(1, 1), Vector2i(1, 2))
	assert(color_clear.has(Vector2i(0, 0)))
	assert(color_clear.has(Vector2i(7, 7)))
	main.board[1][2] = main.make_special(4, main.SPECIAL_COLOR)
	var color_combo_clear = main.special_swap_clear_cells(Vector2i(1, 1), Vector2i(2, 1))
	assert(color_combo_clear.size() == main.BOARD_SIZE * main.BOARD_SIZE)
	assert(color_combo_clear.has(Vector2i(0, 0)))
	assert(color_combo_clear.has(Vector2i(7, 7)))
	assert(main.is_supreme_bloom_clear(color_combo_clear.size()))
	assert(main.special_swap_summary(Vector2i(1, 1), Vector2i(2, 1), color_combo_clear.size()).find("SUPREME BLOOM") >= 0)
	assert(main.supreme_bloom_reward_bonus(color_combo_clear.size()) == 12)
	assert(not main.is_supreme_bloom_clear(line_clear.size()))

	main.board = []
	for y in range(main.BOARD_SIZE):
		var row := []
		for x in range(main.BOARD_SIZE):
			row.append((x + y) % main.FLOWERS.size())
		main.board.append(row)
	main.board[2][2] = 3
	main.board[2][3] = 3
	main.board[2][4] = 3
	main.board[1][3] = 3
	main.board[3][3] = 3
	var t_matches = main.find_matches()
	main.collected = {3: 0}
	main.clear_matches(t_matches, true)
	assert(main.tile_special(main.board[2][3]) == main.SPECIAL_AREA)
	assert(main.collected[3] >= 4)
	var burst_expanded = main.expand_special_clears({Vector2i(2, 2): true})
	main.board[2][2] = main.make_special(3, main.SPECIAL_AREA)
	burst_expanded = main.expand_special_clears({Vector2i(2, 2): true})
	assert(burst_expanded.size() == 9)
	assert(burst_expanded.has(Vector2i(1, 1)))
	assert(burst_expanded.has(Vector2i(3, 3)))

	main.coins = 0
	main.daily_streak = 0
	main.last_daily_claim = ""
	assert(main.can_claim_daily_reward("2026-06-29"))
	var reward_day_1 = main.claim_daily_reward("2026-06-29")
	assert(reward_day_1 == 75)
	assert(main.daily_streak == 1)
	assert(main.coins == reward_day_1)
	assert(not main.can_claim_daily_reward("2026-06-29"))
	var reward_day_2 = main.claim_daily_reward("2026-06-30")
	assert(reward_day_2 == 100)
	assert(main.daily_streak == 2)

	main.start_game()
	await process_frame
	assert(main.board.size() == 8)
	assert(main.board[0].size() == 8)
	assert(main.moves_left > 0)

	main.coins = 45
	main.upgrades_owned = 0
	assert(main.next_upgrade_progress().remaining == 35)
	assert(main.next_upgrade_progress().percent == 56)
	assert(main.next_upgrade_helper_text() == "Next: Flower Cart — 35 coins to go (45/80).")
	main.coins = 1200
	main.upgrades_owned = main.UPGRADES.size()
	assert(main.next_upgrade_helper_text() == "All boutique upgrades acquired. Your floral empire is fully appointed.")

	main.current_level = 0
	main.moves_left = 0
	main.collected = {0: 7, 1: 6}
	assert(main.objectives_remaining_text() == "1 Sol Rot")
	assert(main.level_result_copy(false).begins_with("So close — 1 Sol Rot remaining."))
	assert(main.level_result_copy(true).begins_with("Order complete."))
	var chest = main.reward_chest_summary(146)
	assert(chest.name == "Velvet Bloom Chest")
	assert(chest.coins == 146)
	assert(chest.copy.find("Velvet Bloom Chest") >= 0)
	assert(main.FLOWERPEDIA_ENTRIES.size() == main.FLOWERS.size())
	var flowerpedia_line = main.flowerpedia_entry_text(0)
	assert(flowerpedia_line.find("Sol Rot") >= 0)
	assert(flowerpedia_line.find("symbol") >= 0)

	main.active_extra_moves = 0
	main.active_extra_move_levels_remaining = 0
	main.active_coin_multiplier_percent = 100
	main.active_coin_orders_remaining = 0
	assert(main.apply_spooky_luxury_effect("candlelit_focus"))
	assert(main.active_extra_moves == 2)
	assert(main.active_extra_move_levels_remaining == 3)
	main.current_level = 0
	main.start_game()
	await process_frame
	assert(main.moves_left == main.LEVELS[0].moves + 2)
	assert(main.active_extra_move_levels_remaining == 2)
	assert(main.apply_spooky_luxury_effect("midnight_velvet"))
	assert(main.active_coin_multiplier_percent == 125)
	assert(main.calculate_order_payout(100) == 125)
	main.consume_order_effect_after_win()
	assert(main.active_coin_orders_remaining == 2)
	assert(main.active_effect_summary().find("Candlelit Focus") >= 0)
	assert(main.active_effect_summary().find("Midnight Velvet") >= 0)

	assert(main.upgrade_result_copy(0).find("Flower Cart") >= 0)
	assert(main.upgrade_result_copy(0).find("+4 passive") >= 0)
	main.coins = 1000
	main.upgrades_owned = 0
	main.passive_income = 0
	main.show_tycoon()
	await process_frame
	assert(main.screen == "tycoon")
	main.buy_upgrade(0)
	await process_frame
	assert(main.upgrades_owned == 1)
	assert(main.passive_income > 0)
	assert(main.has_node("LevelResultModal") or main.find_child("UpgradeRevealModal", true, false) != null)

	main.coins = 432
	main.current_level = 2
	main.upgrades_owned = 3
	main.passive_income = 26
	main.daily_streak = 4
	main.last_daily_claim = "2026-06-30"
	main.active_extra_moves = 2
	main.active_extra_move_levels_remaining = 2
	main.active_coin_multiplier_percent = 125
	main.active_coin_orders_remaining = 2
	main.save_progress()
	main.coins = 0
	main.current_level = 0
	main.upgrades_owned = 0
	main.passive_income = 0
	main.daily_streak = 0
	main.last_daily_claim = ""
	main.active_extra_moves = 0
	main.active_extra_move_levels_remaining = 0
	main.active_coin_multiplier_percent = 100
	main.active_coin_orders_remaining = 0
	main.load_progress()
	assert(main.coins == 432)
	assert(main.current_level == 2)
	assert(main.upgrades_owned == 3)
	assert(main.passive_income == 26)
	assert(main.daily_streak == 4)
	assert(main.last_daily_claim == "2026-06-30")
	assert(main.active_extra_moves == 2)
	assert(main.active_extra_move_levels_remaining == 2)
	assert(main.active_coin_multiplier_percent == 125)
	assert(main.active_coin_orders_remaining == 2)
	print("Godot smoke test passed: match board and shop upgrade loop initialize correctly.")
	quit(0)
