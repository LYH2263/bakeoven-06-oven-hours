from app.services.oven_engine import (
    Interval,
    Occupancy,
    RecipeDurations,
    build_occupancies,
    find_conflicts,
    fits_business_hours,
    next_free_window,
)


def test_half_open_no_touch_conflict():
    a = Occupancy(1, Interval(0, 30), "bake", 1)
    b = Occupancy(1, Interval(30, 60), "bake", 2)
    assert find_conflicts([a], [b]) == []


def test_overlap_detected():
    recipe = RecipeDurations(20, 30)
    cand = build_occupancies(1, 9, 10, recipe)
    existing = [Occupancy(1, Interval(25, 40), "bake", 1)]
    assert find_conflicts(existing, cand)


def test_next_free_window_after_busy():
    existing = [
        Occupancy(1, Interval(0, 40), "ferment", 1),
        Occupancy(1, Interval(40, 70), "bake", 1),
    ]
    w = next_free_window(existing, 1, duration=30, search_from=0)
    assert w == Interval(70, 100)


def test_next_free_in_gap():
    existing = [
        Occupancy(1, Interval(0, 20), "bake", 1),
        Occupancy(1, Interval(80, 100), "bake", 2),
    ]
    w = next_free_window(existing, 1, duration=30, search_from=0)
    assert w == Interval(20, 50)


def test_business_hours_fully_inside():
    cand = build_occupancies(1, 9, 9 * 60, RecipeDurations(40, 35))
    assert fits_business_hours(cand, 8 * 60, 22 * 60)


def test_business_hours_end_exactly_at_close_ok():
    # 半开区间：占炉结束正好等于打烊分钟是允许的
    cand = build_occupancies(1, 9, 21 * 60, RecipeDurations(30, 30))
    assert fits_business_hours(cand, 8 * 60, 22 * 60)


def test_business_hours_start_exactly_at_open_ok():
    cand = build_occupancies(1, 9, 8 * 60, RecipeDurations(30, 30))
    assert fits_business_hours(cand, 8 * 60, 22 * 60)


def test_business_hours_before_open_rejected():
    cand = build_occupancies(1, 9, 7 * 60 + 50, RecipeDurations(10, 10))
    assert not fits_business_hours(cand, 8 * 60, 22 * 60)


def test_business_hours_past_close_rejected():
    # 发酵在营业时段内，但烘烤段探出打烊点
    cand = build_occupancies(1, 9, 21 * 60 + 45, RecipeDurations(10, 20))
    assert not fits_business_hours(cand, 8 * 60, 22 * 60)


def test_next_free_window_uses_oven_hours():
    # 该炉 20:00 开门 22:00 打烊：120 分钟刚好顶到打烊（半开允许），121 分钟排不下
    w = next_free_window([], 1, duration=120, search_from=20 * 60, search_to=22 * 60)
    assert w == Interval(20 * 60, 22 * 60)
    assert next_free_window([], 1, duration=121, search_from=20 * 60, search_to=22 * 60) is None


def test_next_free_window_skips_busy_within_hours():
    existing = [Occupancy(1, Interval(9 * 60, 10 * 60), "bake", 1)]
    w = next_free_window(existing, 1, duration=45, search_from=8 * 60, search_to=22 * 60)
    assert w == Interval(8 * 60, 8 * 60 + 45)
