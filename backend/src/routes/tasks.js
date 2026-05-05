const router = require('express').Router();
const ctrl = require('../controllers/taskController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createTaskSchema, updateTaskSchema } = require('../validators/taskValidator');

router.use(auth);

router.get('/', ctrl.list);
router.post('/', validate(createTaskSchema), ctrl.create);
router.put('/:id', validate(updateTaskSchema), ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
