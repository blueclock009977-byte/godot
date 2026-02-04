extends Area2D

const SPEED = 600.0
const DAMAGE = 5
var direction := 1

func _ready() -> void:
	# 画面外で消える
	var timer = get_tree().create_timer(3.0)
	timer.timeout.connect(queue_free)
	# 衝突シグナル接続
	body_entered.connect(_on_body_entered)

func _physics_process(delta: float) -> void:
	position.x += SPEED * direction * delta

func _on_body_entered(body: Node2D) -> void:
	if body.has_method("take_damage"):
		body.take_damage(DAMAGE)
	queue_free()
