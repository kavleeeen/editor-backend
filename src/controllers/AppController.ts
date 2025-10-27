import { Request, Response } from 'express';

class AppController {
  async getHello(req: Request, res: Response): Promise<void> {
    res.status(200).json({ message: 'Hello from Editor Backend!' });
  }
}

export default new AppController();

