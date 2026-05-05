const router = require('express').Router();
const ctrl = require('../controllers/projectController');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/role');
const validate = require('../middleware/validate');
const { createProjectSchema, updateProjectSchema } = require('../validators/projectValidator');

router.use(auth);

router.get('/', ctrl.list);
router.get('/:id', ctrl.get);
router.post('/', requireRole('admin'), validate(createProjectSchema), ctrl.create);
router.put('/:id', requireRole('admin'), validate(updateProjectSchema), ctrl.update);
router.delete('/:id', requireRole('admin'), ctrl.remove);

module.exports = router;
