import { Router } from 'express';
import { ReceiptController } from '../controllers/receipt.controller';
import { upload } from '../middlewares/upload.middleware';

const router = Router();
const receiptController = new ReceiptController();

router.post('/', upload.single('image'), (req, res, next) => {
  receiptController.createReceipt(req, res, next);
});

router.get('/', (req, res, next) => {
  receiptController.getReceipts(req, res, next);
});

router.get('/:id', (req, res, next) => {
  receiptController.getReceiptById(req, res, next);
});

router.patch('/:id', (req, res, next) => {
  receiptController.updateReceipt(req, res, next);
});

export default router;
